/**
 * Content Plan — the structured, validated result the AI produces for the
 * WordPress generator. The AI returns JSON; it is parsed, validated against a
 * typed contract and sanitised (never interpreted as code). On any failure a
 * deterministic Content Plan is built from the project config, so the generator
 * always receives a valid plan.
 *
 * This reuses the Sprint 2 mechanism (AI step -> variable -> transform) and the
 * existing Knowledge/Prompt integration. No new AI logic and no parallel
 * Knowledge system are introduced.
 */
import { err, isErr, ok, type Result } from "@telemax/core";
import { slugify, type StructuredValue } from "@telemax/knowledge";
import type { GeneratorTransform } from "@telemax/generator-engine";
import type { ResolvedWordPressConfig } from "./types.js";
import { isFallback } from "./ai-meta.js";

/** A category the generated theme will scaffold. */
export interface ContentPlanCategory {
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
}

/** SEO metadata for the site. */
export interface ContentPlanSeo {
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
}

/** The typed contract consumed by the WordPress generator. */
export interface ContentPlan {
  readonly siteTitle: string;
  readonly tagline: string;
  readonly siteDescription: string;
  readonly seo: ContentPlanSeo;
  readonly categories: readonly ContentPlanCategory[];
  /** Optional, not yet wired into templates (documented as deferred). */
  readonly homepage?: { readonly headline?: string; readonly sections?: readonly string[] };
  readonly initialContent?: readonly { readonly title: string; readonly category: string }[];
}

export type ContentPlanSource = "ai" | "fallback";
export type ContentPlanValidation = "passed" | "failed";

/** Content Plan plus provenance, transferred as a single generation variable. */
export interface ContentPlanEnvelope {
  readonly plan: ContentPlan;
  readonly source: ContentPlanSource;
  readonly validation: ContentPlanValidation;
}

/** Variable names exchanged inside the pipeline. */
export const AI_CONTENT_PLAN_VAR = "aiContentPlanRaw";
export const CONTENT_PLAN_ENVELOPE_VAR = "contentPlanEnvelope";
export const META_BASE_VAR = "metaFallbackBase";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reduce an AI-provided value to safe plain text: strips PHP/HTML tags and
 * backticks so nothing the model returns can become executable code, collapses
 * whitespace and caps length.
 */
export function sanitizeText(value: unknown, max = 200): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<\?[\s\S]*?\?>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[`]/g, "")
    .split("")
    .map((ch) => (ch.charCodeAt(0) < 0x20 ? " " : ch))
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Parse the AI response into an object, tolerating text around the JSON. */
export function parseContentPlan(raw: string): Result<unknown, Error> {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return err(new Error("empty AI response"));
  const tryParse = (s: string): unknown => {
    try {
      return JSON.parse(s) as unknown;
    } catch {
      return undefined;
    }
  };
  const direct = tryParse(trimmed);
  if (direct !== undefined) return ok(direct);
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    const sliced = tryParse(trimmed.slice(start, end + 1));
    if (sliced !== undefined) return ok(sliced);
  }
  return err(new Error("invalid JSON"));
}

/** Validate a parsed value against the {@link ContentPlan} contract. */
export function validateContentPlan(value: unknown): Result<ContentPlan, Error> {
  if (!isObject(value)) return err(new Error("content plan is not an object"));

  const reqStr = (key: string): string | undefined => {
    const v = value[key];
    return typeof v === "string" && v.trim() !== "" ? sanitizeText(v) : undefined;
  };
  const siteTitle = reqStr("siteTitle");
  const tagline = reqStr("tagline");
  const siteDescription = reqStr("siteDescription");
  if (siteTitle === undefined || tagline === undefined || siteDescription === undefined) {
    return err(new Error("missing or invalid required field (siteTitle/tagline/siteDescription)"));
  }

  const seoRaw = value["seo"];
  if (!isObject(seoRaw)) return err(new Error("missing seo object"));
  const seoTitle = typeof seoRaw["title"] === "string" ? sanitizeText(seoRaw["title"]) : "";
  const seoDescription =
    typeof seoRaw["description"] === "string" ? sanitizeText(seoRaw["description"]) : "";
  if (seoTitle === "" || seoDescription === "")
    return err(new Error("invalid seo (title/description)"));
  const keywords = Array.isArray(seoRaw["keywords"])
    ? seoRaw["keywords"]
        .filter((k): k is string => typeof k === "string")
        .map((k) => sanitizeText(k, 40))
        .filter((k) => k !== "")
        .slice(0, 20)
    : [];

  const catsRaw = value["categories"];
  if (!Array.isArray(catsRaw) || catsRaw.length === 0) {
    return err(new Error("missing categories"));
  }
  const categories: ContentPlanCategory[] = [];
  for (const raw of catsRaw) {
    if (!isObject(raw)) continue;
    const name = typeof raw["name"] === "string" ? sanitizeText(raw["name"], 60) : "";
    if (name === "") continue;
    const slugSrc =
      typeof raw["slug"] === "string" && raw["slug"].trim() !== "" ? raw["slug"] : name;
    const description =
      typeof raw["description"] === "string" ? sanitizeText(raw["description"]) : undefined;
    categories.push({
      name,
      slug: slugify(sanitizeText(slugSrc, 60)),
      ...(description !== undefined && description !== "" ? { description } : {}),
    });
  }
  if (categories.length === 0) return err(new Error("no valid categories"));

  return ok({
    siteTitle,
    tagline,
    siteDescription,
    seo: { title: seoTitle, description: seoDescription, keywords },
    categories,
  });
}

/** Build a valid Content Plan deterministically from the project config. */
export function deterministicContentPlan(
  config: ResolvedWordPressConfig,
  seoBase = "",
): ContentPlan {
  const description =
    seoBase.trim() !== ""
      ? sanitizeText(seoBase)
      : `${config.siteName} — ${config.siteDescription} Read the latest news, analysis and stories.`;
  return {
    siteTitle: config.siteName,
    tagline: config.siteDescription,
    siteDescription: config.siteDescription,
    seo: { title: config.siteName, description, keywords: [...config.categories] },
    categories: config.categories.map((name) => ({ name, slug: slugify(name) })),
  };
}

/** Turn a raw AI response into a validated Content Plan or a deterministic one. */
export function buildContentPlan(
  raw: string,
  config: ResolvedWordPressConfig,
  seoBase = "",
): ContentPlanEnvelope {
  const fallback = (): ContentPlan => deterministicContentPlan(config, seoBase);
  if (isFallback(raw)) return { plan: fallback(), source: "fallback", validation: "passed" };
  const parsed = parseContentPlan(raw);
  if (isErr(parsed)) return { plan: fallback(), source: "fallback", validation: "failed" };
  const validated = validateContentPlan(parsed.value);
  if (isErr(validated)) return { plan: fallback(), source: "fallback", validation: "failed" };
  return { plan: validated.value, source: "ai", validation: "passed" };
}

/** Transform: build the Content Plan envelope from the AI output + config. */
export function contentPlanTransform(config: ResolvedWordPressConfig): GeneratorTransform {
  return (_input, context) => {
    const rawVar = context.variables[AI_CONTENT_PLAN_VAR];
    const raw = typeof rawVar === "string" ? rawVar : "";
    const seoVar = context.variables[META_BASE_VAR];
    const seoBase = typeof seoVar === "string" ? seoVar : "";
    const envelope = buildContentPlan(raw, config, seoBase);
    return Promise.resolve(ok(envelope as unknown as StructuredValue));
  };
}

function planField(pick: (plan: ContentPlan) => StructuredValue): GeneratorTransform {
  return (_input, context) => {
    const envelope = context.variables[CONTENT_PLAN_ENVELOPE_VAR] as unknown as
      | ContentPlanEnvelope
      | undefined;
    return Promise.resolve(ok(envelope !== undefined ? pick(envelope.plan) : ""));
  };
}

/** Field-extractor transforms that flatten the Content Plan into template vars. */
export const CONTENT_PLAN_FIELD_TRANSFORMS: Readonly<Record<string, GeneratorTransform>> = {
  "wp-cp-title": planField((p) => p.siteTitle),
  "wp-cp-tagline": planField((p) => p.tagline),
  "wp-cp-description": planField((p) => p.siteDescription),
  "wp-cp-meta": planField((p) => p.seo.description),
  "wp-cp-seotitle": planField((p) => p.seo.title),
  "wp-cp-categories": planField((p) => p.categories.map((c) => c.name).join(", ")),
  "wp-cp-json": planField((p) => JSON.stringify(p, null, 2)),
};

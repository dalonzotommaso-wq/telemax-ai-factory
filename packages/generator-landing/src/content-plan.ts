/**
 * Content Plan — the structured, validated result the AI produces for the
 * Landing Page generator. The AI returns JSON; it is parsed, validated against a
 * typed contract and sanitised (never interpreted as code). On any failure a
 * deterministic Content Plan is built from the project config, so the generator
 * always receives a valid plan.
 *
 * This is the SAME mechanism as `@telemax/generator-wordpress` (AI step ->
 * variable -> transform), with a contract shaped for a single-page site.
 */
import { err, isErr, ok, type Result } from "@telemax/core";
import { slugify, type StructuredValue } from "@telemax/knowledge";
import type { GeneratorTransform } from "@telemax/generator-engine";
import type { ResolvedLandingPageConfig } from "./types.js";
import { isFallback } from "./ai.js";
import { escapeHtml } from "./html.js";

export { escapeHtml };

/** SEO metadata for the page. */
export interface LandingContentPlanSeo {
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
}

/** A call-to-action button. */
export interface LandingContentPlanCta {
  readonly label: string;
  readonly href: string;
}

/** The hero (above the fold). */
export interface LandingContentPlanHero {
  readonly headline: string;
  readonly subheadline: string;
  readonly primaryCta: LandingContentPlanCta;
}

/** A content section rendered as an in-page anchor block. */
export interface LandingContentPlanSection {
  readonly id: string;
  readonly title: string;
  readonly body: string;
}

/** A short feature/benefit card. */
export interface LandingContentPlanFeature {
  readonly title: string;
  readonly description: string;
}

/** The typed contract consumed by the Landing Page generator. */
export interface LandingContentPlan {
  readonly siteName: string;
  readonly seo: LandingContentPlanSeo;
  readonly hero: LandingContentPlanHero;
  readonly sections: readonly LandingContentPlanSection[];
  readonly features: readonly LandingContentPlanFeature[];
  readonly footer: { readonly tagline: string };
}

export type ContentPlanSource = "ai" | "fallback";
export type ContentPlanValidation = "passed" | "failed";

/** Content Plan plus provenance, transferred as a single generation variable. */
export interface ContentPlanEnvelope {
  readonly plan: LandingContentPlan;
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
 * Reduce an AI-provided value to safe plain text: strips HTML/PHP tags and
 * backticks so nothing the model returns can become markup or executable code,
 * collapses whitespace and caps length.
 */
export function sanitizeText(value: unknown, max = 400): string {
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

/**
 * Constrain a CTA href to a safe, expected shape: an in-page anchor, an absolute
 * http(s) URL or a mailto: link. Anything else (e.g. `javascript:`) falls back
 * to the contact anchor.
 */
export function sanitizeHref(value: unknown): string {
  if (typeof value !== "string") return "#contact";
  const trimmed = value.trim();
  if (/^#[\w-]+$/.test(trimmed)) return trimmed;
  if (/^https?:\/\/[^\s"'<>]+$/i.test(trimmed)) return trimmed;
  if (/^mailto:[^\s"'<>]+$/i.test(trimmed)) return trimmed;
  return "#contact";
}

/** Parse the AI response into a value, tolerating text around the JSON. */
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

function validateSeo(value: unknown): Result<LandingContentPlanSeo, Error> {
  if (!isObject(value)) return err(new Error("missing seo object"));
  const title = typeof value["title"] === "string" ? sanitizeText(value["title"], 120) : "";
  const description =
    typeof value["description"] === "string" ? sanitizeText(value["description"], 200) : "";
  if (title === "" || description === "") return err(new Error("invalid seo (title/description)"));
  const keywords = Array.isArray(value["keywords"])
    ? value["keywords"]
        .filter((k): k is string => typeof k === "string")
        .map((k) => sanitizeText(k, 40))
        .filter((k) => k !== "")
        .slice(0, 20)
    : [];
  return ok({ title, description, keywords });
}

function validateHero(value: unknown): Result<LandingContentPlanHero, Error> {
  if (!isObject(value)) return err(new Error("missing hero object"));
  const headline =
    typeof value["headline"] === "string" ? sanitizeText(value["headline"], 120) : "";
  const subheadline =
    typeof value["subheadline"] === "string" ? sanitizeText(value["subheadline"], 240) : "";
  if (headline === "" || subheadline === "") {
    return err(new Error("invalid hero (headline/subheadline)"));
  }
  const ctaRaw = isObject(value["primaryCta"]) ? value["primaryCta"] : {};
  const label =
    typeof ctaRaw["label"] === "string" && ctaRaw["label"].trim() !== ""
      ? sanitizeText(ctaRaw["label"], 40)
      : "Get in touch";
  return ok({ headline, subheadline, primaryCta: { label, href: sanitizeHref(ctaRaw["href"]) } });
}

function validateSections(value: unknown): Result<readonly LandingContentPlanSection[], Error> {
  if (!Array.isArray(value) || value.length === 0) return err(new Error("missing sections"));
  const sections: LandingContentPlanSection[] = [];
  for (const raw of value) {
    if (!isObject(raw)) continue;
    const title = typeof raw["title"] === "string" ? sanitizeText(raw["title"], 80) : "";
    const body = typeof raw["body"] === "string" ? sanitizeText(raw["body"], 600) : "";
    if (title === "" || body === "") continue;
    const idSrc = typeof raw["id"] === "string" && raw["id"].trim() !== "" ? raw["id"] : title;
    sections.push({ id: slugify(sanitizeText(idSrc, 40)), title, body });
  }
  if (sections.length === 0) return err(new Error("no valid sections"));
  return ok(sections.slice(0, 8));
}

function validateFeatures(value: unknown): readonly LandingContentPlanFeature[] {
  if (!Array.isArray(value)) return [];
  const features: LandingContentPlanFeature[] = [];
  for (const raw of value) {
    if (!isObject(raw)) continue;
    const title = typeof raw["title"] === "string" ? sanitizeText(raw["title"], 60) : "";
    const description =
      typeof raw["description"] === "string" ? sanitizeText(raw["description"], 200) : "";
    if (title === "" || description === "") continue;
    features.push({ title, description });
  }
  return features.slice(0, 6);
}

/** Validate a parsed value against the {@link LandingContentPlan} contract. */
export function validateContentPlan(value: unknown): Result<LandingContentPlan, Error> {
  if (!isObject(value)) return err(new Error("content plan is not an object"));

  const siteName =
    typeof value["siteName"] === "string" && value["siteName"].trim() !== ""
      ? sanitizeText(value["siteName"], 80)
      : undefined;
  if (siteName === undefined) return err(new Error("missing or invalid siteName"));

  const seo = validateSeo(value["seo"]);
  if (isErr(seo)) return seo;
  const hero = validateHero(value["hero"]);
  if (isErr(hero)) return hero;
  const sections = validateSections(value["sections"]);
  if (isErr(sections)) return sections;

  const footerRaw = isObject(value["footer"]) ? value["footer"] : {};
  const footerTagline =
    typeof footerRaw["tagline"] === "string" && footerRaw["tagline"].trim() !== ""
      ? sanitizeText(footerRaw["tagline"], 160)
      : `© ${siteName}`;

  return ok({
    siteName,
    seo: seo.value,
    hero: hero.value,
    sections: sections.value,
    features: validateFeatures(value["features"]),
    footer: { tagline: footerTagline },
  });
}

/** Build a valid Content Plan deterministically from the project config. */
export function deterministicContentPlan(
  config: ResolvedLandingPageConfig,
  seoBase = "",
): LandingContentPlan {
  const description =
    seoBase.trim() !== "" ? sanitizeText(seoBase, 200) : sanitizeText(config.description, 200);
  const sections: LandingContentPlanSection[] = config.sections.map((title) => ({
    id: slugify(title),
    title,
    body: `${title} — placeholder copy for ${config.siteName}. Replace with real content.`,
  }));
  return {
    siteName: config.siteName,
    seo: {
      title: `${config.siteName} — ${config.tagline}`.slice(0, 120),
      description,
      keywords: config.sections.map((s) => s.toLowerCase()),
    },
    hero: {
      headline: config.tagline,
      subheadline: config.description,
      primaryCta: { label: "Get in touch", href: "#contact" },
    },
    sections,
    features: [],
    footer: { tagline: `© ${config.siteName}` },
  };
}

/** Turn a raw AI response into a validated Content Plan or a deterministic one. */
export function buildContentPlan(
  raw: string,
  config: ResolvedLandingPageConfig,
  seoBase = "",
): ContentPlanEnvelope {
  const fallback = (): LandingContentPlan => deterministicContentPlan(config, seoBase);
  if (isFallback(raw)) return { plan: fallback(), source: "fallback", validation: "passed" };
  const parsed = parseContentPlan(raw);
  if (isErr(parsed)) return { plan: fallback(), source: "fallback", validation: "failed" };
  const validated = validateContentPlan(parsed.value);
  if (isErr(validated)) return { plan: fallback(), source: "fallback", validation: "failed" };
  return { plan: validated.value, source: "ai", validation: "passed" };
}

/** Transform: build the Content Plan envelope from the AI output + config. */
export function contentPlanTransform(config: ResolvedLandingPageConfig): GeneratorTransform {
  return (_input, context) => {
    const rawVar = context.variables[AI_CONTENT_PLAN_VAR];
    const raw = typeof rawVar === "string" ? rawVar : "";
    const seoVar = context.variables[META_BASE_VAR];
    const seoBase = typeof seoVar === "string" ? seoVar : "";
    const envelope = buildContentPlan(raw, config, seoBase);
    return Promise.resolve(ok(envelope as unknown as StructuredValue));
  };
}

function withPlan(pick: (plan: LandingContentPlan) => StructuredValue): GeneratorTransform {
  return (_input, context) => {
    const envelope = context.variables[CONTENT_PLAN_ENVELOPE_VAR] as unknown as
      | ContentPlanEnvelope
      | undefined;
    return Promise.resolve(ok(envelope !== undefined ? pick(envelope.plan) : ""));
  };
}

/** Render the in-page navigation (one link per section, ids/titles escaped). */
export function renderNavHtml(plan: LandingContentPlan): string {
  return plan.sections
    .map((s) => `        <a href="#${escapeHtml(s.id)}">${escapeHtml(s.title)}</a>`)
    .join("\n");
}

/** Render the sections array as an HTML string (every field escaped). */
export function renderSectionsHtml(plan: LandingContentPlan): string {
  return plan.sections
    .map(
      (s) =>
        `      <section id="${escapeHtml(s.id)}" class="section">\n` +
        `        <h2 class="section-title">${escapeHtml(s.title)}</h2>\n` +
        `        <p class="section-body">${escapeHtml(s.body)}</p>\n` +
        `      </section>`,
    )
    .join("\n");
}

/** Render the features array as an HTML string (every field escaped). */
export function renderFeaturesHtml(plan: LandingContentPlan): string {
  if (plan.features.length === 0) return "";
  const cards = plan.features
    .map(
      (f) =>
        `        <li class="feature-card">\n` +
        `          <h3 class="feature-title">${escapeHtml(f.title)}</h3>\n` +
        `          <p class="feature-description">${escapeHtml(f.description)}</p>\n` +
        `        </li>`,
    )
    .join("\n");
  return `      <ul class="feature-grid">\n${cards}\n      </ul>`;
}

/** Field-extractor transforms that flatten the Content Plan into template vars. */
export const CONTENT_PLAN_FIELD_TRANSFORMS: Readonly<Record<string, GeneratorTransform>> = {
  "lp-cp-seotitle": withPlan((p) => escapeHtml(p.seo.title)),
  "lp-cp-meta": withPlan((p) => escapeHtml(p.seo.description)),
  "lp-cp-keywords": withPlan((p) => escapeHtml(p.seo.keywords.join(", "))),
  "lp-cp-hero-headline": withPlan((p) => escapeHtml(p.hero.headline)),
  "lp-cp-hero-subheadline": withPlan((p) => escapeHtml(p.hero.subheadline)),
  "lp-cp-cta-label": withPlan((p) => escapeHtml(p.hero.primaryCta.label)),
  "lp-cp-cta-href": withPlan((p) => escapeHtml(p.hero.primaryCta.href)),
  "lp-cp-footer": withPlan((p) => escapeHtml(p.footer.tagline)),
  "lp-cp-nav-html": withPlan((p) => renderNavHtml(p)),
  "lp-cp-sections-html": withPlan((p) => renderSectionsHtml(p)),
  "lp-cp-features-html": withPlan((p) => renderFeaturesHtml(p)),
  "lp-cp-json": withPlan((p) => JSON.stringify(p, null, 2)),
};

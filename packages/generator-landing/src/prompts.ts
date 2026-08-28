/**
 * Prompt Engine integration. Registers the deterministic SEO-base template and
 * the AI instruction that asks a model for a structured Content Plan.
 */
import { ServiceContainer, isErr } from "@telemax/core";
import { registerPromptEngine } from "@telemax/prompt-engine";

/** Template id of the deterministic SEO-base prompt (feeds the fallback plan). */
export const LP_META_TEMPLATE = "lp-meta";

/** Template id of the AI instruction that asks for a structured Content Plan. */
export const LP_CONTENT_PLAN_TEMPLATE = "lp-content-plan";

/** The prompt engine type returned by {@link registerPromptEngine}. */
export type PromptEngineInstance = ReturnType<typeof registerPromptEngine>;

/** Body of the deterministic SEO-base template. */
export const LP_META_BODY =
  "{{siteName}} — {{description}} One-page site: what we do and how to reach us.";

/** Body of the Content Plan instruction. Requests strictly a JSON object. */
export const LP_CONTENT_PLAN_BODY =
  'You are writing the copy for a single-page marketing landing page ("vetrina") for "{{siteName}}" — {{description}}\n' +
  "Return ONLY a single JSON object (no prose, no markdown, no code fences) with EXACTLY this shape:\n" +
  "{\n" +
  '  "siteName": string,\n' +
  '  "seo": { "title": string, "description": string, "keywords": string[] },\n' +
  '  "hero": { "headline": string, "subheadline": string, "primaryCta": { "label": string, "href": string } },\n' +
  '  "sections": [ { "id": string, "title": string, "body": string } ],\n' +
  '  "features": [ { "title": string, "description": string } ],\n' +
  '  "footer": { "tagline": string }\n' +
  "}\n" +
  "Rules: plain text only in every field; no HTML, no scripts, no markdown. " +
  'CTA "href" must be an in-page anchor like "#contact" or an absolute https URL. ' +
  "Keep seo.description under 160 characters. Provide 3 to 6 sections and 0 to 6 features. " +
  "Section ids are lowercase, hyphen-separated. Use the project conventions below for ids and naming.\n\n" +
  "Conventions:\n{{conventions}}";

/** Build a Prompt engine with the landing-page templates registered. */
export async function buildPromptEngine(): Promise<PromptEngineInstance> {
  const engine = registerPromptEngine(new ServiceContainer());
  await engine.registerTemplate({
    id: LP_META_TEMPLATE,
    name: "Landing Page meta",
    body: LP_META_BODY,
  });
  await engine.registerTemplate({
    id: LP_CONTENT_PLAN_TEMPLATE,
    name: "Landing Page Content Plan (AI instruction)",
    body: LP_CONTENT_PLAN_BODY,
  });
  return engine;
}

/** Render the AI instruction for the Content Plan via the Prompt Engine. */
export async function renderContentPlanInstruction(
  engine: PromptEngineInstance,
  variables: { siteName: string; description: string; conventions: string },
): Promise<string> {
  const rendered = await engine.render({ templateId: LP_CONTENT_PLAN_TEMPLATE, variables });
  return isErr(rendered) ? "" : rendered.value.content;
}

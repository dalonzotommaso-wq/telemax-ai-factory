/**
 * Prompt Engine integration. Registers the meta-description template used by the
 * generated SEO components and exposes its id.
 */
import { ServiceContainer, isErr } from "@telemax/core";
import { registerPromptEngine } from "@telemax/prompt-engine";

/** Template id of the WordPress meta-description prompt. */
export const WP_META_TEMPLATE = "wp-meta";

/** Template id of the AI instruction that asks a model for a meta description. */
export const WP_META_AI_TEMPLATE = "wp-meta-ai";

/** Template id of the AI instruction that asks for a structured Content Plan. */
export const WP_CONTENT_PLAN_TEMPLATE = "wp-content-plan";

/** The prompt engine type returned by {@link registerPromptEngine}. */
export type PromptEngineInstance = ReturnType<typeof registerPromptEngine>;

/** Body of the meta-description prompt template (deterministic fallback content). */
export const WP_META_BODY =
  "{{siteName}} — {{siteDescription}} Read the latest news, analysis and stories.";

/** Body of the AI instruction template. Versioned through the Prompt Engine. */
export const WP_META_AI_BODY =
  "Write a single SEO meta description (one line, max 155 characters, no quotes) " +
  'for the WordPress news website "{{siteName}}" — {{siteDescription}} ' +
  "Follow the project conventions below. Respond with only the meta description text.\n\n" +
  "Conventions:\n{{conventions}}";

/** Body of the Content Plan instruction. Requests strictly a JSON object. */
export const WP_CONTENT_PLAN_BODY =
  'You are planning a WordPress news website named "{{siteName}}" — {{siteDescription}}\n' +
  "Return ONLY a single JSON object (no prose, no markdown, no code fences) with EXACTLY this shape:\n" +
  "{\n" +
  '  "siteTitle": string,\n' +
  '  "tagline": string,\n' +
  '  "siteDescription": string,\n' +
  '  "seo": { "title": string, "description": string, "keywords": string[] },\n' +
  '  "categories": [ { "name": string, "slug": string, "description": string } ]\n' +
  "}\n" +
  "Rules: plain text only in every field; no HTML, no PHP, no scripts. " +
  "Keep siteDescription and seo.description under 160 characters. Provide 4 to 6 categories. " +
  "Use the project conventions below for slugs and naming.\n\n" +
  "Conventions:\n{{conventions}}";

/** Build a Prompt engine with the WordPress meta templates registered. */
export async function buildPromptEngine(): Promise<PromptEngineInstance> {
  const engine = registerPromptEngine(new ServiceContainer());
  await engine.registerTemplate({
    id: WP_META_TEMPLATE,
    name: "WordPress meta",
    body: WP_META_BODY,
  });
  await engine.registerTemplate({
    id: WP_META_AI_TEMPLATE,
    name: "WordPress meta (AI instruction)",
    body: WP_META_AI_BODY,
  });
  await engine.registerTemplate({
    id: WP_CONTENT_PLAN_TEMPLATE,
    name: "WordPress Content Plan (AI instruction)",
    body: WP_CONTENT_PLAN_BODY,
  });
  return engine;
}

/** Render the AI instruction for the meta description via the Prompt Engine. */
export async function renderMetaInstruction(
  engine: PromptEngineInstance,
  variables: { siteName: string; siteDescription: string; conventions: string },
): Promise<string> {
  const rendered = await engine.render({ templateId: WP_META_AI_TEMPLATE, variables });
  return isErr(rendered) ? "" : rendered.value.content;
}

/** Render the AI instruction for the Content Plan via the Prompt Engine. */
export async function renderContentPlanInstruction(
  engine: PromptEngineInstance,
  variables: { siteName: string; siteDescription: string; conventions: string },
): Promise<string> {
  const rendered = await engine.render({ templateId: WP_CONTENT_PLAN_TEMPLATE, variables });
  return isErr(rendered) ? "" : rendered.value.content;
}

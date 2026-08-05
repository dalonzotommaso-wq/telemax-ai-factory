/**
 * Prompt Engine integration. Registers the meta-description template used by the
 * generated SEO components and exposes its id.
 */
import { ServiceContainer } from "@telemax/core";
import { registerPromptEngine } from "@telemax/prompt-engine";

/** Template id of the WordPress meta-description prompt. */
export const WP_META_TEMPLATE = "wp-meta";

/** The prompt engine type returned by {@link registerPromptEngine}. */
export type PromptEngineInstance = ReturnType<typeof registerPromptEngine>;

/** Body of the meta-description prompt template. */
export const WP_META_BODY =
  "{{siteName}} — {{siteDescription}} Read the latest news, analysis and stories.";

/** Build a Prompt engine with the WordPress meta template registered. */
export async function buildPromptEngine(): Promise<PromptEngineInstance> {
  const engine = registerPromptEngine(new ServiceContainer());
  await engine.registerTemplate({
    id: WP_META_TEMPLATE,
    name: "WordPress meta",
    body: WP_META_BODY,
  });
  return engine;
}

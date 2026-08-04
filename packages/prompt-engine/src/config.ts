/**
 * Centralized configuration for the Prompt Engine (typed object + safe defaults).
 */

/** Cache-related settings. */
export interface PromptCacheConfig {
  readonly enabled: boolean;
  readonly maxEntries: number;
}

/** The resolved Prompt Engine configuration. */
export interface PromptEngineConfig {
  readonly defaultLanguage: string;
  readonly defaultFormat: "text" | "markdown";
  readonly enableVersioning: boolean;
  readonly strictRendering: boolean;
  readonly cache: PromptCacheConfig;
}

/** Partial configuration input accepted by {@link resolvePromptConfig}. */
export interface PromptEngineConfigInput {
  readonly defaultLanguage?: string;
  readonly defaultFormat?: "text" | "markdown";
  readonly enableVersioning?: boolean;
  readonly strictRendering?: boolean;
  readonly cache?: Partial<PromptCacheConfig>;
}

/** Safe, zero-configuration defaults. */
export const DEFAULT_PROMPT_CONFIG: PromptEngineConfig = {
  defaultLanguage: "en",
  defaultFormat: "text",
  enableVersioning: true,
  strictRendering: false,
  cache: { enabled: true, maxEntries: 256 },
};

/** Merge a partial input over {@link DEFAULT_PROMPT_CONFIG}. */
export function resolvePromptConfig(input?: PromptEngineConfigInput): PromptEngineConfig {
  return {
    defaultLanguage: input?.defaultLanguage ?? DEFAULT_PROMPT_CONFIG.defaultLanguage,
    defaultFormat: input?.defaultFormat ?? DEFAULT_PROMPT_CONFIG.defaultFormat,
    enableVersioning: input?.enableVersioning ?? DEFAULT_PROMPT_CONFIG.enableVersioning,
    strictRendering: input?.strictRendering ?? DEFAULT_PROMPT_CONFIG.strictRendering,
    cache: {
      enabled: input?.cache?.enabled ?? DEFAULT_PROMPT_CONFIG.cache.enabled,
      maxEntries: input?.cache?.maxEntries ?? DEFAULT_PROMPT_CONFIG.cache.maxEntries,
    },
  };
}

/** Centralized configuration for the Generator Engine (typed object + defaults). */
import type { StructuredObject } from "@telemax/knowledge";

/** Result-cache settings. */
export interface GeneratorCacheConfig {
  readonly enabled: boolean;
  readonly maxEntries: number;
}

/** The resolved Generator Engine configuration. */
export interface GeneratorEngineConfig {
  readonly defaultLanguage: string;
  readonly defaultTarget?: string;
  readonly enableVersioning: boolean;
  readonly maxArtifacts: number;
  readonly cache: GeneratorCacheConfig;
}

/** Partial configuration input accepted by {@link resolveGeneratorConfig}. */
export interface GeneratorEngineConfigInput {
  readonly defaultLanguage?: string;
  readonly defaultTarget?: string;
  readonly enableVersioning?: boolean;
  readonly maxArtifacts?: number;
  readonly cache?: Partial<GeneratorCacheConfig>;
}

/** Per-generator configuration (target and defaults). */
export interface GeneratorConfiguration {
  readonly target?: string;
  readonly outputDir?: string;
  readonly variables?: StructuredObject;
}

/** Safe, zero-configuration defaults. */
export const DEFAULT_GENERATOR_CONFIG: GeneratorEngineConfig = {
  defaultLanguage: "en",
  enableVersioning: true,
  maxArtifacts: 1000,
  cache: { enabled: true, maxEntries: 128 },
};

/** Merge a partial input over {@link DEFAULT_GENERATOR_CONFIG}. */
export function resolveGeneratorConfig(input?: GeneratorEngineConfigInput): GeneratorEngineConfig {
  const base = DEFAULT_GENERATOR_CONFIG;
  return {
    defaultLanguage: input?.defaultLanguage ?? base.defaultLanguage,
    enableVersioning: input?.enableVersioning ?? base.enableVersioning,
    maxArtifacts: input?.maxArtifacts ?? base.maxArtifacts,
    cache: {
      enabled: input?.cache?.enabled ?? base.cache.enabled,
      maxEntries: input?.cache?.maxEntries ?? base.cache.maxEntries,
    },
    ...(input?.defaultTarget !== undefined ? { defaultTarget: input.defaultTarget } : {}),
  };
}

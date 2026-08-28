/** Assemble the complete variable record (config-derived + design tokens). */
import type { StructuredValue } from "@telemax/knowledge";
import type { ResolvedLandingPageConfig } from "./types.js";
import { buildVariables } from "./variables.js";
import { defaultDesignTokens, tokensToCss } from "./tokens.js";

/** Build every variable consumed by the Landing Page generator. */
export function assembleVariables(
  config: ResolvedLandingPageConfig,
  year: number,
  generatedAt: string,
): Record<string, StructuredValue> {
  const tokens = defaultDesignTokens(config);
  return {
    ...buildVariables(config, year, generatedAt),
    tokensCss: tokensToCss(tokens),
    designTokensJson: JSON.stringify(tokens, null, 2),
  };
}

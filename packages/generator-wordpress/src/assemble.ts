/** Assemble the complete variable record (config-derived + blueprint JSON). */
import type { StructuredValue } from "@telemax/knowledge";
import type { ResolvedWordPressConfig } from "./types.js";
import { buildVariables } from "./variables.js";
import {
  accessibilityBlueprint,
  advertisementBlueprint,
  blueprintDoc,
  buildProjectBlueprint,
  componentRegistry,
  defaultDesignTokens,
  layoutBlueprint,
  performanceBlueprint,
  seoBlueprint,
  tokensToCss,
  webVitalsBlueprint,
} from "./blueprint/index.js";

/** Build every variable consumed by the WordPress News generator. */
export function assembleVariables(
  config: ResolvedWordPressConfig,
  year: number,
  generatedAt: string,
): Record<string, StructuredValue> {
  const tokens = defaultDesignTokens(config);
  const blueprint = buildProjectBlueprint(config);
  return {
    ...buildVariables(config, year, generatedAt),
    tokensCss: tokensToCss(tokens),
    designTokensJson: JSON.stringify(tokens, null, 2),
    layoutBlueprintJson: JSON.stringify(layoutBlueprint(config), null, 2),
    componentsJson: JSON.stringify(componentRegistry(), null, 2),
    seoBlueprintJson: JSON.stringify(seoBlueprint(config), null, 2),
    a11yBlueprintJson: JSON.stringify(accessibilityBlueprint(tokens), null, 2),
    webVitalsJson: JSON.stringify(webVitalsBlueprint(), null, 2),
    advertisingJson: JSON.stringify(advertisementBlueprint(), null, 2),
    performanceJson: JSON.stringify(performanceBlueprint(), null, 2),
    projectBlueprintJson: JSON.stringify(blueprint, null, 2),
    blueprintDoc: blueprintDoc(blueprint),
  };
}

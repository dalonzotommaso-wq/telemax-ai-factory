/** Compute the flat variable record consumed by the generator templates. */
import type { StructuredValue } from "@telemax/knowledge";
import type { ResolvedWordPressConfig } from "./types.js";

/** Version stamped into generated artifacts. */
export const GENERATOR_VERSION = "0.1.0";

/** Names of every variable referenced by the templates (used for validation). */
export const KNOWN_VARIABLES: readonly string[] = [
  "siteName",
  "siteDescription",
  "language",
  "themeSlug",
  "themeName",
  "siteUrl",
  "author",
  "primaryColor",
  "secondaryColor",
  "categoriesList",
  "menuMarkup",
  "adSlotsJson",
  "widgetAreasList",
  "year",
  "generatorVersion",
  "generatedAt",
  "metaDescription",
  "buildManifest",
  "namingConventions",
  "tokensCss",
  "designTokensJson",
  "layoutBlueprintJson",
  "componentsJson",
  "seoBlueprintJson",
  "a11yBlueprintJson",
  "webVitalsJson",
  "advertisingJson",
  "performanceJson",
  "projectBlueprintJson",
  "blueprintDoc",
];

/** Build the base (config-derived) variables. Integration steps add the rest. */
export function buildVariables(
  config: ResolvedWordPressConfig,
  year: number,
  generatedAt: string,
): Record<string, StructuredValue> {
  const menuMarkup = config.menu
    .map((item) => `        <li class="menu-item"><a href="${item.path}">${item.label}</a></li>`)
    .join("\n");
  return {
    siteName: config.siteName,
    siteDescription: config.siteDescription,
    language: config.language,
    themeSlug: config.themeSlug,
    themeName: config.siteName,
    siteUrl: config.siteUrl,
    author: config.author,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    categoriesList: config.categories.join(", "),
    menuMarkup,
    adSlotsJson: JSON.stringify(config.adSlots, null, 2),
    widgetAreasList: "sidebar-main, footer-1, footer-2, footer-3",
    year,
    generatorVersion: GENERATOR_VERSION,
    generatedAt,
  };
}

/** Aggregate of every template artifact produced by the WordPress News generator. */
import type { GeneratorTemplate } from "@telemax/generator-engine";
import { themeTemplates } from "./theme.js";
import { layoutTemplates } from "./layouts.js";
import { partialTemplates } from "./partials.js";
import { adsTemplates } from "./ads.js";
import { seoTemplates } from "./seo.js";
import { docsTemplates } from "./docs.js";
import { pageTemplates } from "./pages.js";
import { assetTemplates } from "./assets.js";

/** All template artifacts, in a stable order. */
export function allTemplates(): readonly GeneratorTemplate[] {
  return [
    ...themeTemplates,
    ...layoutTemplates,
    ...partialTemplates,
    ...adsTemplates,
    ...seoTemplates,
    ...pageTemplates,
    ...assetTemplates,
    ...docsTemplates,
  ];
}

export {
  themeTemplates,
  layoutTemplates,
  partialTemplates,
  adsTemplates,
  seoTemplates,
  docsTemplates,
  pageTemplates,
  assetTemplates,
};

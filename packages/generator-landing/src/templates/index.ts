/** Aggregate of every template artifact produced by the Landing Page generator. */
import type { GeneratorTemplate } from "@telemax/generator-engine";
import { pageTemplates } from "./page.js";
import { styleTemplates } from "./styles.js";
import { scriptTemplates } from "./script.js";
import { docsTemplates } from "./docs.js";

/** All template artifacts, in a stable order. */
export function allTemplates(): readonly GeneratorTemplate[] {
  return [...pageTemplates, ...styleTemplates, ...scriptTemplates, ...docsTemplates];
}

export { pageTemplates, styleTemplates, scriptTemplates, docsTemplates };

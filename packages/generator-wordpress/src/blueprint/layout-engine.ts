/**
 * Layout Engine blueprint: the page regions (header, nav, hero, content, sidebar,
 * widgets, ads, footer) and, per page type, which components and ad positions
 * populate each region.
 */
import type { ResolvedWordPressConfig } from "../types.js";
import { componentRegistry } from "./components.js";

export type Region =
  | "header"
  | "navigation"
  | "hero"
  | "content"
  | "sidebar"
  | "widgets"
  | "ads"
  | "footer";

export interface RegionPlan {
  readonly region: Region;
  readonly components: readonly string[];
  readonly ads: readonly string[];
}

export interface PageLayout {
  readonly page: string;
  readonly regions: readonly RegionPlan[];
}

export interface LayoutBlueprint {
  readonly regions: readonly Region[];
  readonly pages: readonly PageLayout[];
}

const ALL_REGIONS: readonly Region[] = [
  "header",
  "navigation",
  "hero",
  "content",
  "sidebar",
  "widgets",
  "ads",
  "footer",
];

function componentsFor(region: Region): readonly string[] {
  return componentRegistry()
    .filter((component) => component.regions.includes(region))
    .map((component) => component.id);
}

/** Build the layout blueprint for the given config. */
export function layoutBlueprint(config: ResolvedWordPressConfig): LayoutBlueprint {
  const adIds = config.adSlots.map((slot) => slot.id);
  const page = (name: string, regions: readonly Region[]): PageLayout => ({
    page: name,
    regions: regions.map((region) => ({
      region,
      components: componentsFor(region),
      ads: region === "ads" || region === "sidebar" || region === "header" ? adIds : [],
    })),
  });
  return {
    regions: ALL_REGIONS,
    pages: [
      page("front-page", ["header", "navigation", "hero", "content", "sidebar", "ads", "footer"]),
      page("single", ["header", "navigation", "content", "sidebar", "ads", "footer"]),
      page("category", ["header", "navigation", "content", "sidebar", "footer"]),
      page("archive", ["header", "navigation", "content", "footer"]),
      page("page", ["header", "navigation", "content", "footer"]),
    ],
  };
}

/** Resolve a {@link WordPressSiteConfig} into a fully-defaulted configuration. */
import { slugify } from "@telemax/knowledge";
import type { AdSlot, MenuItem, ResolvedWordPressConfig, WordPressSiteConfig } from "./types.js";

const DEFAULT_CATEGORIES: readonly string[] = [
  "Politics",
  "Business",
  "Sports",
  "Culture",
  "Technology",
];

const DEFAULT_ADS: readonly AdSlot[] = [
  { id: "leaderboard", label: "Header Leaderboard", location: "leaderboard" },
  { id: "sidebar", label: "Sidebar MPU", location: "sidebar" },
  { id: "in-article", label: "In-Article", location: "in-article" },
];

function defaultMenu(categories: readonly string[]): readonly MenuItem[] {
  return [
    { label: "Home", path: "/" },
    ...categories.map((category) => ({ label: category, path: `/category/${slugify(category)}` })),
  ];
}

/** Apply defaults to a caller-supplied config. */
export function resolveWordPressConfig(input: WordPressSiteConfig): ResolvedWordPressConfig {
  const categories =
    input.categories !== undefined && input.categories.length > 0
      ? input.categories
      : DEFAULT_CATEGORIES;
  const menu =
    input.menu !== undefined && input.menu.length > 0 ? input.menu : defaultMenu(categories);
  const adSlots =
    input.adSlots !== undefined && input.adSlots.length > 0 ? input.adSlots : DEFAULT_ADS;
  return {
    siteName: input.siteName,
    siteDescription:
      input.siteDescription ?? `${input.siteName} — breaking news, analysis and stories.`,
    language: input.language ?? "en-US",
    themeSlug: input.themeSlug ?? slugify(input.siteName),
    siteUrl: input.siteUrl ?? "https://example.com",
    author: input.author ?? input.siteName,
    primaryColor: input.primaryColor ?? "#c1121f",
    secondaryColor: input.secondaryColor ?? "#1d3557",
    categories,
    menu,
    adSlots,
  };
}

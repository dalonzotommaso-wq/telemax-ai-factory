/**
 * Value types for the WordPress News generator. The generator produces the
 * project scaffold of a WordPress News theme as artifacts — no plugin, no
 * definitive WordPress code.
 */

/** An advertising slot in the generated theme. */
export interface AdSlot {
  readonly id: string;
  readonly label: string;
  readonly location: "leaderboard" | "sidebar" | "in-article";
}

/** A navigation menu item. */
export interface MenuItem {
  readonly label: string;
  readonly path: string;
}

/** Caller-supplied WordPress News site configuration. */
export interface WordPressSiteConfig {
  readonly siteName: string;
  readonly siteDescription?: string;
  readonly language?: string;
  readonly themeSlug?: string;
  readonly siteUrl?: string;
  readonly author?: string;
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
  readonly categories?: readonly string[];
  readonly menu?: readonly MenuItem[];
  readonly adSlots?: readonly AdSlot[];
}

/** Fully-resolved configuration (all defaults applied). */
export interface ResolvedWordPressConfig {
  readonly siteName: string;
  readonly siteDescription: string;
  readonly language: string;
  readonly themeSlug: string;
  readonly siteUrl: string;
  readonly author: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly categories: readonly string[];
  readonly menu: readonly MenuItem[];
  readonly adSlots: readonly AdSlot[];
}

/** The Generator Engine target this generator authors for. */
export const WORDPRESS_TARGET = "wordpress";

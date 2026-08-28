/**
 * Value types for the Landing Page generator. The generator produces a single
 * static HTML page ("vetrina") plus its stylesheet, a small script and a few
 * config/doc files — as artifacts. No build tooling, no framework, no server
 * code: plain HTML/CSS that opens directly in a browser.
 */

/** A content section rendered on the page (seed titles the caller may provide). */
export interface SectionSeed {
  readonly title: string;
}

/** Caller-supplied landing page configuration. Only {@link siteName} is required. */
export interface LandingPageConfig {
  readonly siteName: string;
  readonly tagline?: string;
  readonly description?: string;
  readonly language?: string;
  readonly siteSlug?: string;
  readonly siteUrl?: string;
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
  readonly sections?: readonly string[];
}

/** Fully-resolved configuration (all defaults applied). */
export interface ResolvedLandingPageConfig {
  readonly siteName: string;
  readonly tagline: string;
  readonly description: string;
  readonly language: string;
  readonly siteSlug: string;
  readonly siteUrl: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly sections: readonly string[];
}

/** The Generator Engine target this generator authors for. Free-form; the engine never branches on it. */
export const LANDING_TARGET = "landing-page";

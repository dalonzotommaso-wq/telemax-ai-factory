/** Resolve a {@link LandingPageConfig} into a fully-defaulted configuration. */
import { slugify } from "@telemax/knowledge";
import type { LandingPageConfig, ResolvedLandingPageConfig } from "./types.js";

/** Default section titles for a generic company "vetrina" landing page. */
export const DEFAULT_SECTIONS: readonly string[] = ["About", "Services", "Contact"];

/** Apply defaults to a caller-supplied config. */
export function resolveLandingPageConfig(input: LandingPageConfig): ResolvedLandingPageConfig {
  const sections =
    input.sections !== undefined && input.sections.length > 0 ? input.sections : DEFAULT_SECTIONS;
  return {
    siteName: input.siteName,
    tagline: input.tagline ?? `${input.siteName} — clarity, delivered.`,
    description:
      input.description ??
      `${input.siteName} is a modern landing page. Discover what we do and get in touch.`,
    language: input.language ?? "en",
    siteSlug: input.siteSlug ?? slugify(input.siteName),
    siteUrl: input.siteUrl ?? "https://example.com",
    primaryColor: input.primaryColor ?? "#2563eb",
    secondaryColor: input.secondaryColor ?? "#0f172a",
    sections,
  };
}

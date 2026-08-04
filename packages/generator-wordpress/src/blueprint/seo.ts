/**
 * SEO Blueprint: what each page type declares — title, meta description, Open
 * Graph, Twitter Card, canonical, robots, Schema.org type and JSON-LD.
 */
import type { ResolvedWordPressConfig } from "../types.js";

export interface SeoDeclaration {
  readonly page: string;
  readonly title: string;
  readonly description: string;
  readonly openGraph: { readonly type: string; readonly image: string };
  readonly twitter: { readonly card: string };
  readonly canonical: string;
  readonly robots: string;
  readonly schema: string;
  readonly jsonld: boolean;
}

export interface SeoBlueprint {
  readonly defaults: {
    readonly titleSeparator: string;
    readonly robots: string;
    readonly twitterCard: string;
  };
  readonly pages: readonly SeoDeclaration[];
}

/** Build the SEO blueprint for the given config. */
export function seoBlueprint(config: ResolvedWordPressConfig): SeoBlueprint {
  const image = "assets/images/placeholders/social-default.png";
  const decl = (
    page: string,
    title: string,
    ogType: string,
    schema: string,
    robots = "index,follow",
  ): SeoDeclaration => ({
    page,
    title,
    description: config.siteDescription,
    openGraph: { type: ogType, image },
    twitter: { card: "summary_large_image" },
    canonical: "{permalink}",
    robots,
    schema,
    jsonld: true,
  });
  return {
    defaults: { titleSeparator: " — ", robots: "index,follow", twitterCard: "summary_large_image" },
    pages: [
      decl("front-page", `${config.siteName}`, "website", "NewsMediaOrganization"),
      decl("single", "{post_title} — {site_name}", "article", "NewsArticle"),
      decl("category", "{category} — {site_name}", "website", "CollectionPage"),
      decl("archive", "{archive_title} — {site_name}", "website", "CollectionPage"),
      decl("page", "{page_title} — {site_name}", "website", "WebPage"),
    ],
  };
}

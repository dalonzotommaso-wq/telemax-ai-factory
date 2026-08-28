import { describe, expect, it } from "vitest";
import { DEFAULT_SECTIONS, resolveLandingPageConfig } from "./config.js";

describe("resolveLandingPageConfig", () => {
  it("applies defaults from the site name only", () => {
    const c = resolveLandingPageConfig({ siteName: "Acme Corp" });
    expect(c.siteSlug).toBe("acme-corp");
    expect(c.language).toBe("en");
    expect(c.primaryColor).toMatch(/^#[0-9a-f]{3,8}$/i);
    expect(c.sections).toEqual(DEFAULT_SECTIONS);
    expect(c.tagline).toContain("Acme Corp");
    expect(c.description).toContain("Acme Corp");
  });

  it("keeps caller-supplied values", () => {
    const c = resolveLandingPageConfig({
      siteName: "Acme",
      tagline: "Reliable things",
      description: "We build reliable things.",
      language: "it",
      siteSlug: "custom-slug",
      siteUrl: "https://acme.example",
      primaryColor: "#ff0000",
      secondaryColor: "#00ff00",
      sections: ["Product", "Pricing"],
    });
    expect(c.tagline).toBe("Reliable things");
    expect(c.language).toBe("it");
    expect(c.siteSlug).toBe("custom-slug");
    expect(c.siteUrl).toBe("https://acme.example");
    expect(c.sections).toEqual(["Product", "Pricing"]);
  });

  it("ignores an empty sections array", () => {
    const c = resolveLandingPageConfig({ siteName: "Acme", sections: [] });
    expect(c.sections).toEqual(DEFAULT_SECTIONS);
  });
});

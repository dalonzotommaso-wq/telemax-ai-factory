import { isErr } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { generateWordPressNews } from "./runner.js";

describe("generateWordPressNews", () => {
  it("generates the complete WordPress News project as artifacts", async () => {
    const result = await generateWordPressNews({ siteName: "Test News" }, { year: 2026 });
    if (isErr(result)) {
      throw result.error;
    }
    const generated = result.value;
    expect(generated.state).toBe("completed");
    expect(generated.artifacts.size).toBeGreaterThan(40);

    const get = (path: string): string => generated.artifacts.get(path)?.content ?? "";

    // Core theme files, path-prefixed with the theme slug and interpolated.
    expect(get("test-news/front-page.php")).toContain("get_header");
    expect(get("test-news/single.php")).toContain("get_header");
    expect(get("test-news/header.php")).toContain("Test News");
    expect(get("test-news/footer.php")).toContain("2026");
    expect(get("test-news/style.css")).toContain("Test News");
    expect(get("test-news/manifest.webmanifest")).toContain("Test News");

    // Emitted static + integration artifacts.
    expect(get("test-news/robots.txt")).toContain("example.com");
    expect(get("test-news/.telemax/build-info.json")).toContain("wordpress-news");
    expect(get("test-news/docs/NAMING-CONVENTIONS.md")).toContain("Naming conventions");
    expect(get("test-news/template-parts/seo/meta-tags.php")).toContain("Test News");

    // Blueprint artifacts.
    expect(get("test-news/assets/css/tokens.css")).toContain("--color-primary");
    expect(get("test-news/config/project.blueprint.json")).toContain("wordpress");
    expect(get("test-news/config/design-tokens.json")).toContain("primary");
    expect(get("test-news/config/components.json")).toContain("hero");
    expect(get("test-news/config/accessibility.blueprint.json")).toContain("WCAG 2.2 AA");

    // Component scaffolds.
    expect(get("test-news/template-parts/components/hero.php")).toContain('data-component="hero"');
  });

  it("fails for an invalid configuration before generating", async () => {
    expect(isErr(await generateWordPressNews({ siteName: "" }))).toBe(true);
  });
});

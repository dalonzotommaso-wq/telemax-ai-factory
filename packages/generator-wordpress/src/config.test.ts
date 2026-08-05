import { describe, expect, it } from "vitest";
import { resolveWordPressConfig } from "./config.js";

describe("resolveWordPressConfig", () => {
  it("applies defaults", () => {
    const config = resolveWordPressConfig({ siteName: "Test News" });
    expect(config.themeSlug).toBe("test-news");
    expect(config.language).toBe("en-US");
    expect(config.categories.length).toBeGreaterThan(0);
    expect(config.menu[0]?.label).toBe("Home");
    expect(config.adSlots.length).toBe(3);
    expect(config.siteDescription).toContain("Test News");
  });

  it("honors provided values", () => {
    const config = resolveWordPressConfig({
      siteName: "X",
      themeSlug: "custom",
      categories: ["A", "B"],
      primaryColor: "#123456",
    });
    expect(config.themeSlug).toBe("custom");
    expect(config.categories).toEqual(["A", "B"]);
    expect(config.primaryColor).toBe("#123456");
  });
});

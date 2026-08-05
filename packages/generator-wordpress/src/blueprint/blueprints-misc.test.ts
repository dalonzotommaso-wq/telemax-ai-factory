import { describe, expect, it } from "vitest";
import { seoBlueprint } from "./seo.js";
import { webVitalsBlueprint } from "./web-vitals.js";
import { advertisementBlueprint } from "./advertisement.js";
import { performanceBlueprint } from "./performance.js";
import { resolveWordPressConfig } from "../config.js";

const config = resolveWordPressConfig({ siteName: "N" });

describe("seo blueprint", () => {
  it("declares SEO for every page type", () => {
    const seo = seoBlueprint(config);
    const single = seo.pages.find((page) => page.page === "single");
    expect(single?.schema).toBe("NewsArticle");
    expect(single?.jsonld).toBe(true);
    expect(single?.twitter.card).toBe("summary_large_image");
  });
});

describe("web vitals blueprint", () => {
  it("sets LCP/CLS/INP budgets and techniques", () => {
    const vitals = webVitalsBlueprint();
    expect(vitals.budgets.lcpMs).toBe(2500);
    expect(vitals.budgets.cls).toBe(0.1);
    expect(vitals.budgets.inpMs).toBe(200);
    expect(vitals.techniques.responsiveImages.length).toBeGreaterThan(0);
  });
});

describe("advertisement blueprint", () => {
  it("defines all standard news ad positions", () => {
    const ids = advertisementBlueprint().positions.map((position) => position.id);
    for (const required of [
      "header",
      "sidebar",
      "in-article",
      "footer",
      "sticky",
      "mobile",
      "video",
    ]) {
      expect(ids).toContain(required);
    }
  });
});

describe("performance blueprint", () => {
  it("defines cache, assets and critical CSS", () => {
    const perf = performanceBlueprint();
    expect(perf.css.critical).toBe(true);
    expect(perf.images.formats).toContain("avif");
    expect(perf.cache.assets).toContain("immutable");
  });
});

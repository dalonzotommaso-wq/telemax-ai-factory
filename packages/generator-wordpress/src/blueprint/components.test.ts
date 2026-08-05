import { describe, expect, it } from "vitest";
import { componentRegistry, componentScaffolds } from "./components.js";

describe("component registry", () => {
  it("registers all required news components", () => {
    const ids = componentRegistry().map((component) => component.id);
    for (const required of [
      "hero",
      "card-news",
      "breaking-news",
      "live-banner",
      "video-block",
      "gallery",
      "related-articles",
      "author-box",
      "breadcrumb",
      "social-share",
      "newsletter",
      "comments",
      "banner-adv",
    ]) {
      expect(ids).toContain(required);
    }
  });

  it("generates a scaffold per component with ARIA and lazy media", () => {
    const scaffolds = componentScaffolds();
    expect(scaffolds).toHaveLength(13);
    const hero = scaffolds.find((scaffold) => scaffold.id === "wp.component.hero");
    expect(hero?.body).toContain('role="region"');
    expect(hero?.body).toContain('loading="lazy"');
  });
});

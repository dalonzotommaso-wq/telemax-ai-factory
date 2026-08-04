import { describe, expect, it } from "vitest";
import { layoutBlueprint } from "./layout-engine.js";
import { resolveWordPressConfig } from "../config.js";

describe("layout blueprint", () => {
  it("defines regions and per-page plans", () => {
    const layout = layoutBlueprint(resolveWordPressConfig({ siteName: "N" }));
    expect(layout.regions).toContain("header");
    expect(layout.regions).toContain("footer");
    const front = layout.pages.find((page) => page.page === "front-page");
    expect(front).toBeDefined();
    const content = front?.regions.find((region) => region.region === "content");
    expect(content?.components.length).toBeGreaterThan(0);
  });
});

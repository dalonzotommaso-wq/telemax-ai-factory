import { describe, expect, it } from "vitest";
import { buildWordPressNewsDefinition, WORDPRESS_NEWS_GENERATOR } from "./generator.js";
import { resolveWordPressConfig } from "./config.js";

describe("buildWordPressNewsDefinition", () => {
  it("builds a wordpress-targeted definition with components and integration steps", () => {
    const definition = buildWordPressNewsDefinition(resolveWordPressConfig({ siteName: "N" }));
    expect(definition.id).toBe(WORDPRESS_NEWS_GENERATOR);
    expect(definition.target).toBe("wordpress");
    expect(
      (definition.templates ?? []).some((template) => template.id === "wp.component.hero"),
    ).toBe(true);
    const kinds = definition.pipeline.steps.map((step) => step.kind);
    expect(kinds).toContain("workflow");
    expect(kinds).toContain("prompt");
    expect(kinds).toContain("transform");
    expect(kinds).toContain("template");
    expect(kinds).toContain("emit");
  });
});

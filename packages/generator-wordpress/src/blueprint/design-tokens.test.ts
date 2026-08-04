import { describe, expect, it } from "vitest";
import { defaultDesignTokens, tokensToCss } from "./design-tokens.js";
import { resolveWordPressConfig } from "../config.js";

describe("design tokens", () => {
  it("derives colors from config and exposes every scale", () => {
    const tokens = defaultDesignTokens(
      resolveWordPressConfig({ siteName: "N", primaryColor: "#abcdef" }),
    );
    expect(tokens.colors["primary"]).toBe("#abcdef");
    expect(Object.keys(tokens.spacing).length).toBeGreaterThan(3);
    expect(Object.keys(tokens.zIndex).length).toBeGreaterThan(3);
    expect(Object.keys(tokens.shadows).length).toBe(3);
    expect(tokens.animations.durations["base"]).toBe("200ms");
  });

  it("renders CSS custom properties", () => {
    const css = tokensToCss(defaultDesignTokens(resolveWordPressConfig({ siteName: "N" })));
    expect(css).toContain(":root {");
    expect(css).toContain("--color-primary:");
    expect(css).toContain("--space-md:");
  });
});

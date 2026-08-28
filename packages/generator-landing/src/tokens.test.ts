import { describe, expect, it } from "vitest";
import { resolveLandingPageConfig } from "./config.js";
import { defaultDesignTokens, tokensToCss } from "./tokens.js";

const cfg = resolveLandingPageConfig({ siteName: "Acme", primaryColor: "#123456" });

describe("design tokens", () => {
  it("uses the resolved brand colour as the primary token", () => {
    expect(defaultDesignTokens(cfg).colors["primary"]).toBe("#123456");
  });

  it("renders CSS custom properties for colours, spacing and typography", () => {
    const css = tokensToCss(defaultDesignTokens(cfg));
    expect(css).toContain(":root {");
    expect(css).toContain("--color-primary: #123456;");
    expect(css).toContain("--space-md:");
    expect(css).toContain("--font-size-base:");
  });

  it("serialises to valid JSON", () => {
    const json = JSON.stringify(defaultDesignTokens(cfg));
    expect(() => {
      JSON.parse(json);
    }).not.toThrow();
  });
});

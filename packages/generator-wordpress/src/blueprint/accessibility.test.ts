import { describe, expect, it } from "vitest";
import { accessibilityBlueprint, contrastRatio } from "./accessibility.js";
import { defaultDesignTokens } from "./design-tokens.js";
import { resolveWordPressConfig } from "../config.js";

describe("accessibility blueprint", () => {
  it("computes WCAG contrast ratios", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 1);
  });

  it("targets WCAG 2.2 AA with passing default contrast", () => {
    const blueprint = accessibilityBlueprint(
      defaultDesignTokens(resolveWordPressConfig({ siteName: "N" })),
    );
    expect(blueprint.standard).toBe("WCAG 2.2 AA");
    expect(blueprint.landmarks).toContain("main");
    expect(blueprint.contrastPasses).toBe(true);
  });
});

describe("brand primary contrast threshold (WCAG large-text / UI)", () => {
  it("accepts a vibrant primary that meets 3:1 against the background", () => {
    // #E75480 on white is ~3.5:1 — valid for headings/links/UI (AA large / 1.4.11),
    // even though it is below the 4.5:1 normal-text threshold.
    const blueprint = accessibilityBlueprint({
      colors: { background: "#ffffff", text: "#111111", primary: "#E75480", secondary: "#2e2e2e" },
    } as unknown as Parameters<typeof accessibilityBlueprint>[0]);
    const primaryPair = blueprint.contrast.find((c) => c.pair === "primary-on-background");
    expect(primaryPair?.requiredRatio).toBe(3);
    expect(primaryPair?.passes).toBe(true);
    expect(blueprint.contrastPasses).toBe(true);
  });

  it("still requires 4.5:1 for body text on background", () => {
    const blueprint = accessibilityBlueprint({
      colors: { background: "#ffffff", text: "#999999", primary: "#003366", secondary: "#222222" },
    } as unknown as Parameters<typeof accessibilityBlueprint>[0]);
    const textPair = blueprint.contrast.find((c) => c.pair === "text-on-background");
    expect(textPair?.requiredRatio).toBe(4.5);
    // #999999 on white is ~2.85:1 → fails body-text contrast.
    expect(textPair?.passes).toBe(false);
    expect(blueprint.contrastPasses).toBe(false);
  });
});

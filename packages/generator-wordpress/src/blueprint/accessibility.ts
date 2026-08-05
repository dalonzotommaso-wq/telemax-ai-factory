/**
 * Accessibility Blueprint: WCAG 2.2 AA targets, landmarks, ARIA roles, keyboard
 * navigation, focus management and real contrast checking of the design tokens.
 */
import type { DesignTokens } from "./design-tokens.js";

export interface ContrastCheck {
  readonly pair: string;
  readonly ratio: number;
  readonly requiredRatio: number;
  readonly passes: boolean;
  readonly passesAA: boolean;
  readonly passesAALarge: boolean;
}

export interface AccessibilityBlueprint {
  readonly standard: "WCAG 2.2 AA";
  readonly landmarks: readonly string[];
  readonly ariaRoles: Readonly<Record<string, string>>;
  readonly keyboard: readonly string[];
  readonly focus: readonly string[];
  readonly contrast: readonly ContrastCheck[];
  readonly contrastPasses: boolean;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : normalized.padEnd(6, "0").slice(0, 6);
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG relative-luminance contrast ratio between two hex colors. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

/** Build the accessibility blueprint, computing contrast checks from tokens. */
export function accessibilityBlueprint(tokens: DesignTokens): AccessibilityBlueprint {
  const background = tokens.colors["background"] ?? "#ffffff";
  const text = tokens.colors["text"] ?? "#111111";
  const primary = tokens.colors["primary"] ?? "#000000";
  const check = (pair: string, a: string, b: string, requiredRatio: number): ContrastCheck => {
    const ratio = contrastRatio(a, b);
    return {
      pair,
      ratio,
      requiredRatio,
      passes: ratio >= requiredRatio,
      passesAA: ratio >= 4.5,
      passesAALarge: ratio >= 3,
    };
  };
  const contrast = [
    // Body text must meet WCAG 2.2 1.4.3 normal-text contrast (4.5:1).
    check("text-on-background", text, background, 4.5),
    // The brand primary is used for headings, links and UI accents, so the
    // applicable AA threshold is large-text / non-text contrast (3:1) — WCAG
    // 1.4.3 (large text) and 1.4.11 (non-text contrast).
    check("primary-on-background", primary, background, 3),
    check("background-on-primary", background, primary, 3),
  ];
  return {
    standard: "WCAG 2.2 AA",
    landmarks: ["banner", "navigation", "main", "complementary", "contentinfo"],
    ariaRoles: {
      header: "banner",
      nav: "navigation",
      main: "main",
      sidebar: "complementary",
      footer: "contentinfo",
    },
    keyboard: [
      "All interactive elements are reachable and operable by keyboard.",
      "Visible skip-link to main content.",
      "Logical tab order following the document flow.",
    ],
    focus: [
      "Never remove focus outlines; provide a visible focus style.",
      "Trap focus within modals and restore it on close.",
      "Move focus to newly revealed content (e.g. live regions).",
    ],
    contrast,
    contrastPasses: contrast.every((entry) => entry.passes),
  };
}

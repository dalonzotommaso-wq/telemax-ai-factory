/**
 * Minimal design tokens for the Landing Page generator: colors, spacing and
 * typography only. Emitted as JSON (`config/design-tokens.json`) and as CSS
 * custom properties (`assets/css/tokens.css`). All values are JSON-serializable.
 *
 * This is intentionally a small, self-contained module — it does NOT reuse the
 * WordPress generator's much larger blueprint subsystem.
 */
import type { ResolvedLandingPageConfig } from "./types.js";

export interface DesignTokens {
  readonly colors: Readonly<Record<string, string>>;
  readonly spacing: Readonly<Record<string, string>>;
  readonly typography: {
    readonly fontFamilyBody: string;
    readonly fontFamilyHeading: string;
    readonly baseSize: string;
    readonly scale: Readonly<Record<string, string>>;
    readonly lineHeight: Readonly<Record<string, number>>;
  };
}

/** Build the default design tokens from a resolved config. */
export function defaultDesignTokens(config: ResolvedLandingPageConfig): DesignTokens {
  return {
    colors: {
      primary: config.primaryColor,
      secondary: config.secondaryColor,
      text: "#0f172a",
      "text-muted": "#475569",
      background: "#ffffff",
      surface: "#f8fafc",
      border: "#e2e8f0",
      "on-primary": "#ffffff",
    },
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "40px",
      "2xl": "64px",
      "3xl": "96px",
    },
    typography: {
      fontFamilyBody:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontFamilyHeading:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      baseSize: "16px",
      scale: {
        sm: "0.875rem",
        base: "1rem",
        lg: "1.25rem",
        xl: "1.5rem",
        "2xl": "2rem",
        "3xl": "2.75rem",
        "4xl": "3.5rem",
      },
      lineHeight: { tight: 1.15, normal: 1.6 },
    },
  };
}

/** Render design tokens as CSS custom properties on `:root`. */
export function tokensToCss(tokens: DesignTokens): string {
  const lines: string[] = [":root {"];
  for (const [key, value] of Object.entries(tokens.colors)) {
    lines.push(`  --color-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(tokens.spacing)) {
    lines.push(`  --space-${key}: ${value};`);
  }
  lines.push(`  --font-body: ${tokens.typography.fontFamilyBody};`);
  lines.push(`  --font-heading: ${tokens.typography.fontFamilyHeading};`);
  lines.push(`  --font-size-base: ${tokens.typography.baseSize};`);
  for (const [key, value] of Object.entries(tokens.typography.scale)) {
    lines.push(`  --font-size-${key}: ${value};`);
  }
  lines.push("}");
  return `${lines.join("\n")}\n`;
}

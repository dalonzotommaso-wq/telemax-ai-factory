/**
 * Design Tokens blueprint: colors, typography, spacing, breakpoints, z-index,
 * border radius, shadows and animations. Emitted as JSON and as CSS custom
 * properties. All values are JSON-serializable.
 */
import type { ResolvedWordPressConfig } from "../types.js";

export interface DesignTokens {
  readonly colors: Readonly<Record<string, string>>;
  readonly typography: {
    readonly fontFamilyBody: string;
    readonly fontFamilyHeading: string;
    readonly baseSize: string;
    readonly scale: Readonly<Record<string, string>>;
    readonly lineHeight: Readonly<Record<string, number>>;
    readonly weights: Readonly<Record<string, number>>;
  };
  readonly spacing: Readonly<Record<string, string>>;
  readonly breakpoints: Readonly<Record<string, string>>;
  readonly zIndex: Readonly<Record<string, number>>;
  readonly radius: Readonly<Record<string, string>>;
  readonly shadows: Readonly<Record<string, string>>;
  readonly animations: {
    readonly durations: Readonly<Record<string, string>>;
    readonly easings: Readonly<Record<string, string>>;
  };
}

/** Build the default design tokens from a resolved config. */
export function defaultDesignTokens(config: ResolvedWordPressConfig): DesignTokens {
  return {
    colors: {
      primary: config.primaryColor,
      secondary: config.secondaryColor,
      text: "#111111",
      "text-muted": "#5b5b5b",
      background: "#ffffff",
      surface: "#f6f6f6",
      border: "#e2e2e2",
      link: config.primaryColor,
      breaking: "#c1121f",
      live: "#e63946",
    },
    typography: {
      fontFamilyBody: 'Georgia, "Times New Roman", serif',
      fontFamilyHeading: '"Helvetica Neue", Arial, sans-serif',
      baseSize: "18px",
      scale: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.25rem",
        xl: "1.5rem",
        "2xl": "2rem",
        "3xl": "2.5rem",
      },
      lineHeight: { tight: 1.2, normal: 1.6, loose: 1.8 },
      weights: { regular: 400, medium: 500, bold: 700 },
    },
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "40px",
      "2xl": "64px",
    },
    breakpoints: { sm: "480px", md: "768px", lg: "1024px", xl: "1280px" },
    zIndex: { base: 0, dropdown: 100, sticky: 200, header: 300, overlay: 400, modal: 500 },
    radius: { none: "0", sm: "4px", md: "8px", lg: "16px", pill: "999px" },
    shadows: {
      sm: "0 1px 2px rgba(0,0,0,0.08)",
      md: "0 4px 12px rgba(0,0,0,0.12)",
      lg: "0 12px 32px rgba(0,0,0,0.16)",
    },
    animations: {
      durations: { fast: "120ms", base: "200ms", slow: "400ms" },
      easings: { standard: "cubic-bezier(0.2, 0, 0, 1)", emphasized: "cubic-bezier(0.3, 0, 0, 1)" },
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
  for (const [key, value] of Object.entries(tokens.radius)) {
    lines.push(`  --radius-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(tokens.shadows)) {
    lines.push(`  --shadow-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(tokens.breakpoints)) {
    lines.push(`  --bp-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(tokens.zIndex)) {
    lines.push(`  --z-${key}: ${String(value)};`);
  }
  lines.push("}");
  return `${lines.join("\n")}\n`;
}

// -----------------------------------------------------------------------------
// ESLint 9 flat configuration for the whole monorepo.
//
// The configuration is intentionally strict and type-aware. The rule that
// forbids `any` (architectural rule: "`any` is forbidden except in documented
// exceptional cases") is enforced here as an error; a genuine exception must be
// silenced locally with an inline disable comment AND a justification.
//
// `eslint-config-prettier` is applied last so formatting concerns are owned by
// Prettier and never fought over by ESLint.
// -----------------------------------------------------------------------------
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  // Files/paths that ESLint should never look at.
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/node_modules/**",
      "**/*.tsbuildinfo",
    ],
  },

  // Base JavaScript recommendations.
  eslint.configs.recommended,

  // Type-checked TypeScript recommendations (requires TS project service).
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Project-wide TypeScript settings and house rules.
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Ban `any`. Documented exceptions must disable this rule inline.
      "@typescript-eslint/no-explicit-any": "error",
      // Prefer explicit boundaries on exported API surfaces.
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      // Enforce type-only imports for types (works with verbatimModuleSyntax).
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      // Unused vars are errors, but allow the leading-underscore escape hatch.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Encourage exhaustive handling and safe async usage.
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },

  // Test files may relax a few rules that are noisy in fixtures/spies.
  {
    files: ["**/*.test.ts", "**/*.spec.ts", "tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // Plain JS config files (this file, prettier/commitlint/lint-staged configs)
  // are not part of any TS project, so disable type-aware rules for them.
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Disable formatting rules that would conflict with Prettier. Keep last.
  prettier,
);

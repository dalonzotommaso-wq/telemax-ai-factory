// -----------------------------------------------------------------------------
// Prettier configuration.
//
// Prettier is the single source of truth for code formatting; ESLint defers to
// it via eslint-config-prettier. Keep this list small and intentional.
// -----------------------------------------------------------------------------

/** @type {import("prettier").Config} */
export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: "as-needed",
  trailingComma: "all",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
};

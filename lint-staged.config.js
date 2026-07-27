// -----------------------------------------------------------------------------
// lint-staged configuration.
//
// Runs only against staged files in the Husky `pre-commit` hook, so quality
// gates stay fast. ESLint fixes and Prettier formatting are applied in place;
// files are re-staged automatically by lint-staged after the fixers run.
// -----------------------------------------------------------------------------

/** @type {import("lint-staged").Configuration} */
export default {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,cjs,mjs,json,md,yml,yaml}": ["prettier --write"],
};

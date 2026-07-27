// -----------------------------------------------------------------------------
// commitlint configuration.
//
// Enforces the Conventional Commits specification on every commit message via
// the Husky `commit-msg` hook. See docs/conventions/commit-convention.md for
// the allowed types and the reasoning behind them.
// -----------------------------------------------------------------------------

/** @type {import("@commitlint/types").UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Constrain the allowed commit types to a curated, documented set.
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    // Keep the subject line readable in tools that truncate.
    "header-max-length": [2, "always", 100],
  },
};

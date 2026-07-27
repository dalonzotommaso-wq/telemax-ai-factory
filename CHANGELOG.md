# Changelog

All notable changes to the workspace tooling and repository-level configuration
are documented here. Per-package changes live in each package's own
`CHANGELOG.md` and are managed by [Changesets](./.changeset/README.md).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

### Added

- Initial monorepo foundation: pnpm workspaces + Turborepo pipeline.
- Strict TypeScript (NodeNext, ESM) base configuration.
- ESLint 9 flat config, Prettier, Vitest, commitlint, Husky, lint-staged.
- GitHub Actions CI and Changesets-based release workflow.
- Framework packages `@telemax/core`, `@telemax/config`, `@telemax/generator-kit`.
- Architecture documentation (SPEC-001), ADRs and contribution conventions.

# Branching strategy

We use a lightweight trunk-based model.

## Branches

- **`main`** is the single long-lived branch. It is always releasable and
  protected: changes land only through reviewed pull requests, and CI must pass.
- **Short-lived branches** are created from `main` for each unit of work and
  deleted after merge.

## Branch names

Use a type prefix and a short, hyphenated description, optionally with a tracker
id:

```
feat/plugin-hot-reload
fix/registry-cycle-detection
docs/adr-config-provider
chore/bump-turbo
```

Prefixes mirror the commit types: `feat`, `fix`, `docs`, `refactor`, `perf`,
`test`, `build`, `ci`, `chore`.

## Pull requests

- Keep PRs focused and small enough to review well.
- The PR description states intent and links any relevant issue/ADR.
- All quality gates (format, lint, typecheck, test, build) must be green.
- Include a changeset when a package's published behavior changes
  (see [release-workflow.md](release-workflow.md)).
- Prefer **squash merge** so `main` history is one clean, conventional commit
  per change.

# Changesets

This directory is managed by [Changesets](https://github.com/changesets/changesets).

Changesets are how per-package version bumps and changelog entries are recorded.
Any pull request that changes the published behavior of a package must include a
changeset.

## Adding a changeset

```bash
pnpm changeset
```

Select the affected packages, choose the semver bump (`patch` / `minor` /
`major`), and write a short, user-facing summary. The command writes a Markdown
file here; commit it alongside your change.

See `docs/conventions/release-workflow.md` for the full release process.

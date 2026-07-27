# Release workflow

Versioning and publishing are managed with [Changesets](https://github.com/changesets/changesets).
Each package is versioned independently following Semantic Versioning.

## 1. Add a changeset with your change

When a pull request alters a package's published behavior:

```bash
pnpm changeset
```

Select the affected packages, choose the bump (`patch` / `minor` / `major`), and
write a concise, user-facing summary. Commit the generated file in `.changeset/`
together with your change. Documentation-only or internal-tooling changes that
do not affect any published package do not need a changeset.

## 2. Versioning (automated)

On merge to `main`, the release GitHub Action opens or updates a **"Version
Packages"** pull request that:

- consumes the pending changesets,
- bumps versions,
- updates each affected package's `CHANGELOG.md`.

Locally, the same step is:

```bash
pnpm version-packages
```

## 3. Publishing (automated)

Merging the "Version Packages" pull request triggers the action to build and
publish the updated packages to the registry. Publishing requires an `NPM_TOKEN`
secret to be configured in the repository. The equivalent local command is:

```bash
pnpm release
```

## Semantic Versioning summary

- **patch** — backwards-compatible bug fixes.
- **minor** — backwards-compatible new functionality.
- **major** — backwards-incompatible changes.

While the project is pre-`1.0.0`, breaking changes may occur in minor releases;
they are always called out in the changeset and changelog.

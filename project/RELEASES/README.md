# Releases

Release management for Telemax AI Factory. Versioning is **SemVer**, automated with **Changesets**
(see the repo’s `docs/conventions/release-workflow.md`). Each milestone maps to a release; each
release has notes here.

- [RELEASE-PLAN.md](RELEASE-PLAN.md) — milestone → version map and release gates.
- Release notes: one file per release (e.g. `v0.2.0.md`), created from [`release-notes-template.md`](release-notes-template.md).
- [v0.2.0.md](v0.2.0.md) — engine stack (Knowledge, Prompt, AI, Workflow, Generator).

## Process (summary)

1. Land features with Changesets during the sprint.
2. At milestone completion, the "Version Packages" PR aggregates bumps and changelogs.
3. Merge to publish; write the release notes here; tag the release.

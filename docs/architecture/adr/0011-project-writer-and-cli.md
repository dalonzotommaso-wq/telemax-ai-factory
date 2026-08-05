# ADR-0011 — Filesystem project writer and demo CLI

- **Status:** Accepted
- **Date:** 2026-08-01
- **Context:** SPRINT-009 — WordPress News Generator v1

## Context

Through SPEC-007 the WordPress News generator produced artifacts only in memory.
The v1 goal is a genuinely usable generator that writes a complete WordPress News
project to disk, invoked from a demo CLI, without adding new infrastructure
packages and without changing the architecture.

## Decision

1. **Filesystem writer lives in `@telemax/generator-engine`.** A new
   `FileSystemArtifactWriter` implements the engine's existing `ArtifactWriter`
   port and persists artifacts under a fixed root directory. Writing to disk is a
   generic concern, so it belongs to the engine (its own port), not to a
   target-specific package. It uses only Node built-ins (`node:fs`, `node:path`);
   the default writer stays `InMemoryArtifactWriter`, so existing behavior is
   unchanged. Paths are confined to the root (path-traversal is refused,
   returning a `GeneratorIoError`).
2. **Project assembly stays in `@telemax/generator-wordpress`.** `writeProject`
   persists the generated `ArtifactCollection` via the filesystem writer and adds
   `.telemax/manifest.json` cataloguing every artifact with its content type,
   byte size, SHA-256 checksum and generator version. `generateWordPressNewsProject`
   composes generation + writing and returns a summary.
3. **Demo CLI as a thin entry point.** A small `bin/telemax.ts` parses
   `generate wordpress-news [--out <dir>] [--name <site>] [--url <url>]` and calls
   `generateWordPressNewsProject`, defaulting the output to `output/wordpress-news`.
   It is wired as the root `telemax` script (`pnpm telemax generate wordpress-news`)
   and as the package `bin`. The CLI writes only to `process.stdout`/`stderr`.
4. **Artifacts carry metadata and version.** Generated files embed a header banner
   with the generator version and generation timestamp (`{{generatorVersion}}`,
   `{{generatedAt}}`); JSON blueprints carry `generatedBy`/`generatorVersion`; and
   the manifest records per-artifact version + checksum. No change to the
   `GeneratorArtifact` shape was required.

## Consequences

- **Positive:** the generator is now runnable end-to-end (`brief → generate →
write`), producing a real WordPress theme directory; the filesystem writer is
  reusable by any future generator; no new package, no architectural change; the
  engine remains pure by default.
- **Negative / trade-offs:** the writer is synchronous (matches the `ArtifactWriter`
  port) — adequate for a CLI, not tuned for very large trees; the `.php` output is
  still scaffolding to be completed; editorial copy remains deterministic (no real
  AI provider yet).

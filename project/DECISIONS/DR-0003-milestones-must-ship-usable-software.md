# DR-0003 — Milestones must ship usable software

- **Status:** Accepted
- **Date:** 2026-07-27
- **Owner:** Lead Software Engineer

## Context

A framework can accumulate internal machinery that is never usable on its own. To keep value
flowing and de-risk direction, each milestone must produce something a user can actually run.

## Decision

Every milestone in `ROADMAP.md` defines a concrete, user-facing _usable outcome_ and is not
considered Done until that outcome is demonstrated end-to-end and released (SemVer, via Changesets),
with release notes under `RELEASES/`.

## Consequences

- Continuous demonstrable value; earlier feedback; clearer go/no-go decisions.
- Some cross-cutting work must be sequenced to reach a usable slice sooner (accepted trade-off).

## Alternatives considered

- **Build all infrastructure first, features later.** Rejected: long lead time with no usable output
  and high risk of building the wrong thing.

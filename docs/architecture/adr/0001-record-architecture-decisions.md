# ADR-0001 — Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-01-01

## Context

The project is intended to grow and to be worked on by multiple engineers,
possibly internationally. Significant technical decisions need a durable,
discoverable rationale so that future contributors understand _why_ the system
is shaped the way it is, not merely _how_.

## Decision

We keep Architecture Decision Records (ADRs) under `docs/architecture/adr/`, one
Markdown file per significant decision, using the shared `template.md`. ADRs are
immutable once accepted; a superseding ADR is added when a decision changes.

## Consequences

- New contributors can read the decision history in one place.
- Decisions carry their context, so revisiting them later is informed.
- A small, ongoing documentation cost is incurred per significant decision.

## Alternatives considered

- **No formal record.** Rejected: rationale is quickly lost and re-litigated.
- **A single design document.** Rejected: hard to evolve and to attribute
  decisions to their context over time.

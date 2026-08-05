# DR-0001 — Adopt sprint-based delivery (software-house model)

- **Status:** Accepted
- **Date:** 2026-07-27
- **Owner:** Lead Software Engineer

## Context

The project is moving from ad-hoc SPEC documents to sustained, multi-target product development. It
needs predictable delivery, traceability from features to outcomes, and clear acceptance of work.

## Decision

We operate as a software house in 2-week sprints. A single prioritized backlog feeds a milestone
roadmap; each sprint has an objective, inputs/outputs, acceptance criteria, a checklist and a
deliverable. The Lead Software Engineer owns delivery, grooming and release quality.

## Consequences

- Predictable cadence and demonstrable increments; easy status reporting.
- Some planning overhead per sprint (accepted as worthwhile).
- Requires discipline in keeping backlog and roadmap in sync.

## Alternatives considered

- **Continuous ad-hoc SPECs.** Rejected: no cadence, weak traceability, hard to plan capacity.
- **Kanban-only flow.** Deferred: useful later for support/maintenance, but milestones benefit from
  sprint boundaries now.

# DR-0002 — Estimation and prioritization scales

- **Status:** Accepted
- **Date:** 2026-07-27
- **Owner:** Lead Software Engineer

## Context

Consistent estimates and priorities are needed to plan sprints and sequence milestones.

## Decision

Priority uses `P0`–`P3` (P0 = foundational/blocking). Complexity uses T-shirt sizes `S/M/L/XL`.
Effort uses story points on the Fibonacci scale (`1,2,3,5,8,13,21`). Planning velocity is assumed at
~24 SP per 2-week sprint and re-calibrated from actuals each Planning.

## Consequences

- Comparable estimates across epics; simple capacity math for the roadmap.
- Story points are relative, not time — velocity must be tracked to convert to dates.

## Alternatives considered

- **Ideal-days estimation.** Rejected: encourages false precision and date-anchoring.
- **No estimates (#NoEstimates).** Deferred: viable once flow stabilizes, premature now.

# Release plan

Versioning is SemVer; the platform reaches **General Availability at v1.0** (Milestone M7).
Pre-1.0, minor versions may include breaking changes (always called out in Changesets/notes).

| Version | Milestone                           | Usable outcome                                                                                                                         | Gate                                                                                                                           |
| ------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| v0.1    | M0 — Foundation                     | Framework foundation builds/tests green (SPEC-001).                                                                                    | Delivered.                                                                                                                     |
| v0.2    | M1 — AI Gateway                     | Multi-provider AI gateway (Claude/ChatGPT/Gemini/OpenRouter/Ollama) via CLI + SDK, with routing, resilience, streaming, cost tracking. | AI Orchestrator + engine stack delivered as infrastructure (SPEC-002…006); real providers pending. See [v0.2.0.md](v0.2.0.md). |
| v0.3    | M2 — Generation Engine + first web  | Brief → validated, previewable, exportable Landing Page and Website.                                                                   | All M2 items Done; end-to-end brief→site demoed.                                                                               |
| v0.4    | M3 — Web breadth                    | News portals, WordPress themes/plugins, React apps.                                                                                    | All M3 items Done; each target demoed + build-verified.                                                                        |
| v0.5    | M4 — Backend, API & automations     | Laravel apps, OpenAPI + REST servers, client SDKs, automations.                                                                        | All M4 items Done; API generated + run.                                                                                        |
| v0.6    | M5 — Applications                   | Flutter and desktop apps with packaging.                                                                                               | All M5 items Done; apps built.                                                                                                 |
| v0.7    | M6 — Business platforms & SaaS      | CRM/ERP/SaaS scaffolds with multi-tenancy, auth, quotas, API, console.                                                                 | All M6 items Done; tenant-isolated demo.                                                                                       |
| v1.0    | M7 — Specialized & Marketplace (GA) | HbbTV apps + plugin marketplace; production hardening.                                                                                 | All M7 items Done; GA readiness review passed.                                                                                 |

## Release gates (all releases)

- Format, lint, type-check, unit/integration tests and build are green in CI.
- The milestone’s usable outcome is demonstrated end-to-end.
- Changelogs generated from Changesets; release notes published here; tag pushed.
- Security review for changes touching secrets, auth, tenancy or egress.

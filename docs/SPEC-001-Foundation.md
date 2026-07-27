# SPEC-001 — Foundation

- **Status:** Accepted
- **Scope:** The initial architecture of the Telemax AI Factory monorepo.
- **Audience:** Engineers building on or extending the framework.

## 1. Mission

Telemax AI Factory is a framework and platform for **AI-driven generation of
digital products** — websites, landing pages, applications, software components
and related artifacts. This specification defines the _foundation_: the
structural and architectural baseline on which all future capabilities are
built. The foundation intentionally contains **no concrete generators and no
demo code**; it provides only the primitives and contracts.

## 2. Goals and non-goals

### Goals

- A modular, **plugin-first** architecture where capabilities are added and
  removed without modifying the Core.
- Strict, uniform engineering standards enforced automatically (types, linting,
  formatting, commits, CI).
- Clear, one-way dependency boundaries between layers.
- Centralized, validated configuration.
- Documentation-as-code: architecture and conventions versioned with the source.

### Non-goals (for the foundation)

- Shipping concrete generators or example applications.
- Choosing a runtime AI provider or persistence technology.
- Defining product-specific schemas beyond the minimal platform configuration.

## 3. Technology baseline

| Concern         | Decision                                             |
| --------------- | ---------------------------------------------------- |
| Language        | TypeScript (strict, maximum-safety compiler options) |
| Module system   | ESM (`"type": "module"`), `NodeNext` resolution      |
| Runtime         | Node.js `>= 22` LTS                                  |
| Monorepo        | pnpm workspaces + Turborepo                          |
| Package scope   | `@telemax/*`                                         |
| Linting         | ESLint 9 (flat config, type-aware) + Prettier        |
| Testing         | Vitest                                               |
| Versioning      | Changesets                                           |
| Commit standard | Conventional Commits (commitlint)                    |
| Git hooks       | Husky + lint-staged                                  |
| CI/CD           | GitHub Actions                                       |

## 4. Layered architecture

The system is organized in layers with a strict, one-way dependency direction:

```
        Applications (apps/*)               <- compose everything
              |
        Feature packages / SDKs (packages/*) <- e.g. @telemax/generator-kit
              |
        Configuration (@telemax/config)      <- implements Core contracts
              |
        Core (@telemax/core)                 <- depends on nothing internal
```

**Rule:** a lower layer must never import from a higher one. In particular, the
Core imports nothing from the framework itself; generators and feature packages
depend on the Core, never the reverse (see [ADR-0004](architecture/adr/0004-dependency-direction-core-and-generators.md)).

## 5. The Core (`@telemax/core`)

The Core is the composition root and the only mandatory dependency of every
other package. It is deliberately small and free of business logic.

- **Kernel** — owns the logger, the dependency container and the plugin
  registry; exposes a `created → started → stopped` lifecycle.
- **Plugin system** — a `Plugin` contract plus a `PluginRegistry` that resolves
  activation order from declared dependencies (depth-first topological sort with
  cycle and missing-dependency detection) and runs setup/teardown.
- **Dependency injection** — a type-safe `ServiceContainer` with token-based,
  lazily-memoized resolution, so plugins share collaborators without the Core
  knowing their concrete types.
- **Configuration contract** — `ConfigProvider<TConfig>`, the interface the
  kernel uses to obtain validated configuration.
- **Cross-cutting primitives** — structured `Logger`, a coded `FrameworkError`
  hierarchy, an explicit `Result` type, and nominal (`Branded`) typing helpers.

## 6. Configuration (`@telemax/config`)

A single package is the source of truth for platform configuration. It defines
the schema (`PlatformConfig`), safe defaults, primitive validators, and an
`EnvConfigProvider` that reads an environment-like source, applies defaults,
validates, and returns a typed `Result`. It implements the Core's
`ConfigProvider` contract, so the Core never reads the environment directly.

## 7. The generator SDK (`@telemax/generator-kit`)

The generator kit defines _what a generator is_ without prescribing _what it
does_. It provides the `Generator` contract and an abstract `BaseGenerator`
that also implements the Core's `Plugin`, so generators register with the kernel
like any other plugin. Concrete generators are separate packages and are **not**
part of the foundation.

## 8. Plugin-first extensibility

A plugin is the unit of extensibility. Because the Core interacts with plugins
only through the `Plugin` interface and the `PluginContext` it passes in, any
capability can be added or removed without editing the Core. Inter-plugin
collaboration happens through the shared `ServiceContainer`, keeping plugins
decoupled from one another's concrete implementations.

## 9. Repository structure

See the [root README](../README.md#repository-layout) for the directory map.
Runtime code lives in `core/`, `config/` and `packages/*`; `apps/*` compose
them; content and orchestration assets live in `knowledge/`, `prompts/`,
`templates/` and `workflows/`; developer tooling in `tools/` and `scripts/`.

## 10. Quality gates

Every change must pass, locally and in CI: Prettier format check, type-aware
ESLint (with `any` forbidden), full type-check, unit tests, and a successful
build. Turborepo orders and caches these tasks; Husky enforces them on commit.

## 11. Related documents

- Architecture Decision Records: [`architecture/`](architecture/)
- Conventions: [`conventions/`](conventions/)

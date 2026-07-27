# Contributing

Thank you for contributing to Telemax AI Factory. This guide summarizes the
workflow; the detailed conventions live under [`docs/conventions/`](docs/conventions/).

## Prerequisites

- Node.js `>= 22` (`nvm use` reads `.nvmrc`)
- pnpm `>= 9` (`corepack enable`)

## Setup

```bash
pnpm install
```

Husky Git hooks are installed automatically via the `prepare` script. On commit,
`lint-staged` formats and lints staged files, and `commitlint` validates the
commit message.

## Quality gates

Before opening a pull request, make sure all of the following pass — they are
the same checks CI runs:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Conventions

- **Naming:** [`docs/conventions/naming.md`](docs/conventions/naming.md)
- **Coding style:** [`docs/conventions/coding-style.md`](docs/conventions/coding-style.md)
- **Branching:** [`docs/conventions/branching-strategy.md`](docs/conventions/branching-strategy.md)
- **Commits:** [`docs/conventions/commit-convention.md`](docs/conventions/commit-convention.md)
- **Releases:** [`docs/conventions/release-workflow.md`](docs/conventions/release-workflow.md)

## Changesets

Any change to a package's published behavior must include a changeset:

```bash
pnpm changeset
```

Commit the generated file with your change. See the
[release workflow](docs/conventions/release-workflow.md) for details.

## Architectural rules (must hold)

1. The Core must not depend on generators or feature packages.
2. Generators depend on the Core, never the reverse.
3. Modules are added/removed as plugins without modifying the Core.
4. No duplicated business logic; each package has a single responsibility.
5. `any` is forbidden except in documented, locally-justified cases.

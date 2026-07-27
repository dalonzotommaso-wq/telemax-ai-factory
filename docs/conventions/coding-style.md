# Coding style

Formatting is owned by **Prettier** and correctness by **ESLint** (type-aware);
this document covers the conventions that tooling cannot fully capture.

## TypeScript

- **ESM only.** Use `import`/`export`. Relative imports include the `.js`
  extension, as required by `NodeNext` resolution.
- **Type-only imports/exports** use `import type` / `export type`
  (`verbatimModuleSyntax` is enabled).
- **`any` is forbidden.** Use `unknown` and narrow, or precise generics. A
  genuine exception must be silenced locally with an inline
  `// eslint-disable-next-line @typescript-eslint/no-explicit-any` **and** a
  comment explaining why.
- **Immutability by default.** Prefer `readonly` fields and `readonly`
  array/tuple types; prefer `const`.
- **Explicit public boundaries.** Exported functions and methods should have
  explicit return types.
- **Errors vs. results.** Use the `Result` type for _expected_ failures
  (validation, lookups); throw `FrameworkError` subclasses for programmer errors
  and truly exceptional conditions. Catch clauses treat the error as `unknown`.

## Modules

- Each package exposes a single public entry point (`src/index.ts`). Consumers
  import from the package root; deep imports into another package are not
  supported.
- No duplicated business logic: extract and share via the appropriate package
  rather than copy-paste.

## Comments

- Public types and functions carry TSDoc (`/** ... */`) explaining intent, not
  restating the code.
- Configuration and tooling files carry a header comment describing their role.

## Tests

- Vitest, co-located as `*.test.ts`.
- Tests exercise the framework's own units; they are not demos and contain no
  product/example logic.

# Naming

## Packages

- All packages are published under the `@telemax/*` scope.
- Package names are lowercase, hyphenated, and describe a single responsibility
  (e.g. `@telemax/generator-kit`).

## Directories and files

- Directories and file names are lowercase and hyphenated (kebab-case), e.g.
  `plugin-registry.ts`, `config-loader.ts`.
- Unit tests sit next to the code they cover and end with `.test.ts`.
- One primary concept per file; the file name reflects that concept.

## TypeScript symbols

- **Types, interfaces, classes, enums:** `PascalCase` (`PluginRegistry`,
  `ConfigProvider`). Do not prefix interfaces with `I`.
- **Functions, variables, methods, parameters:** `camelCase` (`resolveOrder`).
- **Constants** that are true module-level constants: `UPPER_SNAKE_CASE`
  (`DEFAULT_CONFIG`, `LEVEL_WEIGHT`).
- **Type parameters:** `PascalCase`, descriptive where it helps (`TConfig`),
  single letters only for trivial generics (`T`, `E`).

## Errors

- Error classes end with `Error` and extend `FrameworkError`.
- Each carries a stable `code` in `UPPER_SNAKE_CASE` prefixed with `ERR_`
  (`ERR_CONFIG`, `ERR_PLUGIN`).

## DI tokens

- Token variables are `UPPER_SNAKE_CASE` and created with `createToken<T>()`
  using a human-readable description that matches the service name.

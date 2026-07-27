# Commit convention

We follow [Conventional Commits](https://www.conventionalcommits.org/). Messages
are validated by `commitlint` via the Husky `commit-msg` hook.

## Format

```
<type>(<optional scope>): <subject>

<optional body>

<optional footer>
```

- **Subject:** imperative mood, no trailing period, max 100 characters for the
  header.
- **Scope:** optional, typically the package or area (e.g. `core`, `config`,
  `generator-kit`, `ci`).

## Allowed types

| Type       | Use for                                                  |
| ---------- | -------------------------------------------------------- |
| `feat`     | A new feature.                                           |
| `fix`      | A bug fix.                                               |
| `docs`     | Documentation only.                                      |
| `style`    | Formatting/whitespace; no code-behavior change.          |
| `refactor` | Code change that neither fixes a bug nor adds a feature. |
| `perf`     | A performance improvement.                               |
| `test`     | Adding or correcting tests.                              |
| `build`    | Build system or dependencies.                            |
| `ci`       | CI configuration and scripts.                            |
| `chore`    | Other maintenance that doesn't touch src or tests.       |
| `revert`   | Reverting a previous commit.                             |

## Breaking changes

Indicate a breaking change with a `!` after the type/scope, and/or a
`BREAKING CHANGE:` footer:

```
feat(core)!: change Kernel.start signature

BREAKING CHANGE: start() no longer accepts a config argument.
```

## Examples

```
feat(generator-kit): add BaseGenerator supports() guard
fix(core): detect circular plugin dependencies
docs(architecture): add ADR-0004 on dependency direction
chore: pin pnpm to 9.15.0
```

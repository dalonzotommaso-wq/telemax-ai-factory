# @telemax/knowledge

All notable changes to this package are documented here. This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) and the format is based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - Unreleased

### Added

- Initial Knowledge Base engine (infrastructure only), depending solely on
  `@telemax/core`.
- Immutable `Document` with checksums and versioning; `DocumentMetadata` with
  categories, tags and a custom map; `KnowledgeCategory` and `KnowledgeTag`
  value objects; `KnowledgeVersion` snapshots.
- Loaders for Markdown, JSON and YAML; prepared PDF and image loaders.
- `KnowledgeRepository` (in-memory) with per-document version history.
- `KnowledgeIndex`: in-memory full-text index; prepared embedding index.
- `KnowledgeValidator` with a composable rule set.
- `KnowledgeRegistry`, `KnowledgeSource`, `KnowledgeService` facade.
- `ExportManager`/`ImportManager` for portable bundles.
- Typed event bus and Core-container DI wiring (`registerKnowledge`).
- Unit tests across all modules.

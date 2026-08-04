/**
 * {@link KnowledgeService} — the façade that ties the engine together.
 *
 * It coordinates loaders (via the registry), validation, the repository, the
 * optional index, versioning and event emission. High-level callers (agents,
 * generators) depend only on this class; every collaborator is injected
 * (Dependency Injection) and addressed through its port (Dependency Inversion).
 */
import { err, isErr, ok, type Logger, type Result } from "@telemax/core";
import { DEFAULT_KNOWLEDGE_CONFIG, type KnowledgeConfig } from "./config.js";
import { Document } from "./domain/document.js";
import { createMetadata, type MetadataInput } from "./domain/metadata.js";
import { versionOf } from "./domain/version.js";
import type { KnowledgeVersion } from "./domain/version.js";
import { NotImplementedError, type KnowledgeError } from "./errors.js";
import { ExportManager, type KnowledgeBundle } from "./export-manager.js";
import { ImportManager } from "./import-manager.js";
import { KnowledgeEventBus, type EventBus, type KnowledgeEvents } from "./events.js";
import type { KnowledgeIndex, KnowledgeRepository, KnowledgeSource } from "./interfaces.js";
import type { KnowledgeRegistry } from "./registry.js";
import type { KnowledgeValidator } from "./validator.js";
import {
  asDocumentId,
  type ContentFormat,
  type DocumentFilter,
  type RawDocument,
  type SearchHit,
  type SearchQuery,
  type StructuredValue,
} from "./types.js";
import { systemClock, uuidIdGenerator, type Clock, type IdGenerator } from "./utils.js";

/** Collaborators required by {@link KnowledgeService}. */
export interface KnowledgeServiceDeps {
  readonly repository: KnowledgeRepository;
  readonly registry: KnowledgeRegistry;
  readonly validator: KnowledgeValidator;
  readonly events?: EventBus<KnowledgeEvents>;
  readonly index?: KnowledgeIndex;
  readonly logger?: Logger;
  readonly clock?: Clock;
  readonly idGenerator?: IdGenerator;
  readonly config?: KnowledgeConfig;
}

/** Input for {@link KnowledgeService.addDocument}. */
export interface AddDocumentInput {
  readonly id?: string;
  readonly format: ContentFormat;
  readonly content: string;
  readonly metadata?: MetadataInput;
  readonly parsed?: StructuredValue;
}

export class KnowledgeService {
  private readonly repository: KnowledgeRepository;
  private readonly registry: KnowledgeRegistry;
  private readonly validator: KnowledgeValidator;
  private readonly events: EventBus<KnowledgeEvents>;
  private readonly index: KnowledgeIndex | undefined;
  private readonly logger: Logger | undefined;
  private readonly clock: Clock;
  private readonly idGenerator: IdGenerator;
  private readonly config: KnowledgeConfig;
  private readonly exporter: ExportManager;
  private readonly importer: ImportManager;

  public constructor(deps: KnowledgeServiceDeps) {
    this.repository = deps.repository;
    this.registry = deps.registry;
    this.validator = deps.validator;
    this.events = deps.events ?? new KnowledgeEventBus();
    this.index = deps.index;
    this.logger = deps.logger;
    this.clock = deps.clock ?? systemClock;
    this.idGenerator = deps.idGenerator ?? uuidIdGenerator;
    this.config = deps.config ?? DEFAULT_KNOWLEDGE_CONFIG;
    this.exporter = new ExportManager(this.repository, this.clock);
    this.importer = new ImportManager(this.repository, this.validator, this.events);
  }

  /** Subscribe to a knowledge event. Returns an unsubscribe function. */
  public on<K extends keyof KnowledgeEvents>(
    event: K,
    handler: (payload: KnowledgeEvents[K]) => void,
  ): () => void {
    return this.events.on(event, handler);
  }

  /** Add a document from explicit content and metadata. */
  public addDocument(input: AddDocumentInput): Promise<Result<Document, KnowledgeError>> {
    const now = this.clock.now().toISOString();
    const id = input.id !== undefined && input.id.length > 0 ? input.id : this.idGenerator.next();
    const metadata = createMetadata(input.metadata ?? {}, now, this.config.defaultLanguage);
    const document = Document.create({
      id: asDocumentId(id),
      format: input.format,
      content: input.content,
      metadata,
      ...(input.parsed !== undefined ? { parsed: input.parsed } : {}),
    });
    return this.persist(document, now);
  }

  /** Ingest a raw document by dispatching to the registered loader. */
  public async ingest(raw: RawDocument): Promise<Result<Document, KnowledgeError>> {
    const loader = this.registry.loaderFor(raw.format);
    if (isErr(loader)) {
      return loader;
    }
    const loaded = await loader.value.load(raw);
    if (isErr(loaded)) {
      this.events.emit("knowledge.error", { error: loaded.error });
      return loaded;
    }
    return this.persist(loaded.value, this.clock.now().toISOString());
  }

  /** Ingest every raw document exposed by a source. */
  public async ingestSource(
    source: KnowledgeSource,
  ): Promise<Result<readonly Document[], KnowledgeError>> {
    const listed = await source.list();
    if (isErr(listed)) {
      return listed;
    }
    const documents: Document[] = [];
    for (const raw of listed.value) {
      const result = await this.ingest(raw);
      if (isErr(result)) {
        return result;
      }
      documents.push(result.value);
    }
    return ok(documents);
  }

  /** Retrieve a document by id. */
  public getDocument(id: string): Promise<Result<Document, KnowledgeError>> {
    return this.repository.get(asDocumentId(id));
  }

  /** List documents, optionally filtered by category/tag/format. */
  public listDocuments(
    filter?: DocumentFilter,
  ): Promise<Result<readonly Document[], KnowledgeError>> {
    return this.repository.list(filter);
  }

  /** Retrieve the version history of a document. */
  public getVersions(id: string): Promise<Result<readonly KnowledgeVersion[], KnowledgeError>> {
    return this.repository.versions(asDocumentId(id));
  }

  /** Remove a document and de-index it. */
  public async removeDocument(id: string): Promise<Result<void, KnowledgeError>> {
    const documentId = asDocumentId(id);
    const removed = await this.repository.remove(documentId);
    if (isErr(removed)) {
      return removed;
    }
    if (this.index !== undefined) {
      const deindexed = await this.index.remove(documentId);
      if (isErr(deindexed)) {
        return deindexed;
      }
    }
    this.events.emit("document.removed", { documentId });
    return ok(undefined);
  }

  /** Search the configured index. */
  public search(query: SearchQuery): Promise<Result<readonly SearchHit[], KnowledgeError>> {
    if (this.index === undefined) {
      return Promise.resolve(
        err(new NotImplementedError("Search requires a configured KnowledgeIndex.")),
      );
    }
    return this.index.search(query);
  }

  /** Export documents into a portable bundle. */
  public exportBundle(filter?: DocumentFilter): Promise<Result<KnowledgeBundle, KnowledgeError>> {
    return this.exporter.export(filter).then((result) => {
      if (!isErr(result)) {
        this.events.emit("export.completed", { exported: result.value.documents.length });
      }
      return result;
    });
  }

  /** Import documents from a bundle. */
  public importBundle(
    bundle: KnowledgeBundle,
  ): Promise<Result<readonly Document[], KnowledgeError>> {
    return this.importer.import(bundle);
  }

  private async persist(
    document: Document,
    now: string,
  ): Promise<Result<Document, KnowledgeError>> {
    const existing = await this.repository.get(document.id);
    const isUpdate = !isErr(existing);
    let toSave = document;
    if (isUpdate) {
      const preservedCreatedAt = existing.value.metadata.createdAt;
      const metadata = { ...document.metadata, createdAt: preservedCreatedAt, updatedAt: now };
      toSave = document.withMetadata(metadata).withVersion(existing.value.version + 1);
    } else {
      toSave = document.withVersion(document.version);
    }

    const validated = this.validator.validate(toSave);
    if (isErr(validated)) {
      this.events.emit("knowledge.error", { error: validated.error });
      return validated;
    }

    const saved = await this.repository.save(toSave);
    if (isErr(saved)) {
      this.events.emit("knowledge.error", { error: saved.error });
      return saved;
    }

    if (this.index !== undefined && this.config.indexing.fullText) {
      const indexed = await this.index.add(toSave);
      if (isErr(indexed)) {
        this.events.emit("knowledge.error", { error: indexed.error });
        return indexed;
      }
      this.events.emit("document.indexed", { documentId: toSave.id });
    }

    this.events.emit("version.created", { version: versionOf(toSave, now) });
    if (isUpdate) {
      this.events.emit("document.updated", {
        document: toSave,
        previousVersion: existing.value.version,
      });
      this.logger?.debug("knowledge document updated", { id: toSave.id });
    } else {
      this.events.emit("document.registered", { document: toSave });
      this.logger?.debug("knowledge document registered", { id: toSave.id });
    }
    return ok(saved.value);
  }
}

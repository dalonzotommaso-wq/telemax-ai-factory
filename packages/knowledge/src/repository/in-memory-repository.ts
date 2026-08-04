/**
 * {@link InMemoryKnowledgeRepository} — a process-local implementation of the
 * {@link KnowledgeRepository} port. Stores documents plus an ordered version
 * history. Suitable as a default and for tests; future adapters (filesystem,
 * database) implement the same port without touching the service.
 */
import { err, ok, type Result } from "@telemax/core";
import { versionOf, type KnowledgeVersion } from "../domain/version.js";
import { KnowledgeNotFoundError, type KnowledgeError } from "../errors.js";
import type { Document } from "../domain/document.js";
import type { KnowledgeRepository } from "../interfaces.js";
import type { DocumentFilter, DocumentId } from "../types.js";
import { systemClock, type Clock } from "../utils.js";

/** Options for {@link InMemoryKnowledgeRepository}. */
export interface RepositoryOptions {
  readonly enableVersioning?: boolean;
  readonly clock?: Clock;
}

export class InMemoryKnowledgeRepository implements KnowledgeRepository {
  private readonly documents = new Map<string, Document>();
  private readonly history = new Map<string, KnowledgeVersion[]>();
  private readonly enableVersioning: boolean;
  private readonly clock: Clock;

  public constructor(options?: RepositoryOptions) {
    this.enableVersioning = options?.enableVersioning ?? true;
    this.clock = options?.clock ?? systemClock;
  }

  public save(document: Document): Promise<Result<Document, KnowledgeError>> {
    if (this.enableVersioning) {
      const snapshots = this.history.get(document.id) ?? [];
      snapshots.push(versionOf(document, this.clock.now().toISOString()));
      this.history.set(document.id, snapshots);
    }
    this.documents.set(document.id, document);
    return Promise.resolve(ok(document));
  }

  public get(id: DocumentId): Promise<Result<Document, KnowledgeError>> {
    const found = this.documents.get(id);
    if (found === undefined) {
      return Promise.resolve(err(new KnowledgeNotFoundError(`Document "${id}" not found.`)));
    }
    return Promise.resolve(ok(found));
  }

  public has(id: DocumentId): Promise<boolean> {
    return Promise.resolve(this.documents.has(id));
  }

  public remove(id: DocumentId): Promise<Result<void, KnowledgeError>> {
    if (!this.documents.has(id)) {
      return Promise.resolve(err(new KnowledgeNotFoundError(`Document "${id}" not found.`)));
    }
    this.documents.delete(id);
    this.history.delete(id);
    return Promise.resolve(ok(undefined));
  }

  public list(filter?: DocumentFilter): Promise<Result<readonly Document[], KnowledgeError>> {
    const all = [...this.documents.values()];
    const filtered = filter === undefined ? all : all.filter((doc) => matches(doc, filter));
    return Promise.resolve(ok(filtered));
  }

  public versions(id: DocumentId): Promise<Result<readonly KnowledgeVersion[], KnowledgeError>> {
    return Promise.resolve(ok(this.history.get(id) ?? []));
  }
}

function matches(document: Document, filter: DocumentFilter): boolean {
  if (filter.format !== undefined && document.format !== filter.format) {
    return false;
  }
  if (filter.categories !== undefined && !hasAny(document.metadata.categories, filter.categories)) {
    return false;
  }
  if (filter.tags !== undefined && !hasAny(document.metadata.tags, filter.tags)) {
    return false;
  }
  return true;
}

function hasAny(values: readonly string[], wanted: readonly string[]): boolean {
  if (wanted.length === 0) {
    return true;
  }
  const set = new Set(values);
  return wanted.some((entry) => set.has(entry));
}

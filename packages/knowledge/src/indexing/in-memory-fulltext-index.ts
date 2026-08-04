/**
 * {@link InMemoryFullTextIndex} — a small inverted index over document title and
 * content, with naive term-frequency scoring and category/tag filtering. It is
 * a working default that satisfies the full-text search port; heavier engines
 * implement the same {@link KnowledgeIndex} interface.
 */
import { ok, type Result } from "@telemax/core";
import { asDocumentId, type DocumentId, type SearchHit, type SearchQuery } from "../types.js";
import { tokenize } from "../utils.js";
import type { Document } from "../domain/document.js";
import type { KnowledgeError } from "../errors.js";
import type { KnowledgeIndex } from "../interfaces.js";

interface IndexedMeta {
  readonly categories: readonly string[];
  readonly tags: readonly string[];
}

export class InMemoryFullTextIndex implements KnowledgeIndex {
  /** term -> (documentId -> term frequency). */
  private readonly postings = new Map<string, Map<string, number>>();
  private readonly meta = new Map<string, IndexedMeta>();

  public add(document: Document): Promise<Result<void, KnowledgeError>> {
    this.removeId(document.id);
    const title = document.metadata.title ?? "";
    for (const token of tokenize(`${title} ${document.content}`)) {
      const posting = this.postings.get(token) ?? new Map<string, number>();
      posting.set(document.id, (posting.get(document.id) ?? 0) + 1);
      this.postings.set(token, posting);
    }
    this.meta.set(document.id, {
      categories: document.metadata.categories,
      tags: document.metadata.tags,
    });
    return Promise.resolve(ok(undefined));
  }

  public remove(id: DocumentId): Promise<Result<void, KnowledgeError>> {
    this.removeId(id);
    return Promise.resolve(ok(undefined));
  }

  public search(query: SearchQuery): Promise<Result<readonly SearchHit[], KnowledgeError>> {
    const terms = tokenize(query.text);
    const scores = new Map<string, number>();
    for (const term of terms) {
      const posting = this.postings.get(term);
      if (posting === undefined) {
        continue;
      }
      for (const [docId, frequency] of posting) {
        if (!this.passesFilter(docId, query)) {
          continue;
        }
        scores.set(docId, (scores.get(docId) ?? 0) + frequency);
      }
    }
    const hits: SearchHit[] = [...scores.entries()]
      .map(([docId, score]) => ({ documentId: asDocumentId(docId), score }))
      .sort((a, b) => b.score - a.score);
    const limited = query.limit !== undefined ? hits.slice(0, query.limit) : hits;
    return Promise.resolve(ok(limited));
  }

  public clear(): Promise<void> {
    this.postings.clear();
    this.meta.clear();
    return Promise.resolve();
  }

  private passesFilter(documentId: string, query: SearchQuery): boolean {
    const meta = this.meta.get(documentId);
    if (meta === undefined) {
      return false;
    }
    if (query.categories !== undefined && !intersects(meta.categories, query.categories)) {
      return false;
    }
    if (query.tags !== undefined && !intersects(meta.tags, query.tags)) {
      return false;
    }
    return true;
  }

  private removeId(id: string): void {
    for (const [term, posting] of this.postings) {
      posting.delete(id);
      if (posting.size === 0) {
        this.postings.delete(term);
      }
    }
    this.meta.delete(id);
  }
}

function intersects(values: readonly string[], wanted: readonly string[]): boolean {
  if (wanted.length === 0) {
    return true;
  }
  const set = new Set(values);
  return wanted.some((entry) => set.has(entry));
}

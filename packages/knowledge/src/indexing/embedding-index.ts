/**
 * {@link EmbeddingKnowledgeIndex} — a prepared embedding-based index. It requires
 * an injected {@link EmbeddingProvider}; without one it cannot be constructed,
 * which is the intended "prepared, not yet enabled" state. Similarity uses
 * cosine distance over provider-supplied vectors.
 */
import { isErr, ok, type Result } from "@telemax/core";
import { asDocumentId, type DocumentId, type SearchHit, type SearchQuery } from "../types.js";
import type { Document } from "../domain/document.js";
import type { KnowledgeError } from "../errors.js";
import type { EmbeddingProvider, KnowledgeIndex } from "../interfaces.js";

export class EmbeddingKnowledgeIndex implements KnowledgeIndex {
  private readonly vectors = new Map<string, readonly number[]>();

  public constructor(private readonly provider: EmbeddingProvider) {}

  public async add(document: Document): Promise<Result<void, KnowledgeError>> {
    const title = document.metadata.title ?? "";
    const embedding = await this.provider.embed(`${title} ${document.content}`);
    if (isErr(embedding)) {
      return embedding;
    }
    this.vectors.set(document.id, embedding.value);
    return ok(undefined);
  }

  public remove(id: DocumentId): Promise<Result<void, KnowledgeError>> {
    this.vectors.delete(id);
    return Promise.resolve(ok(undefined));
  }

  public async search(query: SearchQuery): Promise<Result<readonly SearchHit[], KnowledgeError>> {
    const embedded = await this.provider.embed(query.text);
    if (isErr(embedded)) {
      return embedded;
    }
    const queryVector = embedded.value;
    const hits: SearchHit[] = [...this.vectors.entries()]
      .map(([docId, vector]) => ({
        documentId: asDocumentId(docId),
        score: cosine(queryVector, vector),
      }))
      .sort((a, b) => b.score - a.score);
    const limited = query.limit !== undefined ? hits.slice(0, query.limit) : hits;
    return ok(limited);
  }

  public clear(): Promise<void> {
    this.vectors.clear();
    return Promise.resolve();
  }
}

function cosine(a: readonly number[], b: readonly number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

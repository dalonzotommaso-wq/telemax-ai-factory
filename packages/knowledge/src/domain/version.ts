/**
 * Document versioning.
 *
 * A {@link KnowledgeVersion} is an immutable snapshot of a document at a point
 * in time. The repository keeps an ordered history per document.
 */
import type { DocumentId } from "../types.js";
import type { Document } from "./document.js";
import type { DocumentMetadata } from "./metadata.js";

/** An immutable snapshot of a document version. */
export interface KnowledgeVersion {
  readonly documentId: DocumentId;
  readonly version: number;
  readonly checksum: string;
  readonly content: string;
  readonly metadata: DocumentMetadata;
  readonly createdAt: string;
  readonly note?: string;
}

/** Build a {@link KnowledgeVersion} snapshot from a document. */
export function versionOf(document: Document, createdAt: string, note?: string): KnowledgeVersion {
  return {
    documentId: document.id,
    version: document.version,
    checksum: document.checksum,
    content: document.content,
    metadata: document.metadata,
    createdAt,
    ...(note !== undefined ? { note } : {}),
  };
}

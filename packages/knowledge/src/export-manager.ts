/**
 * {@link ExportManager} — serializes documents into a portable, JSON-friendly
 * {@link KnowledgeBundle}. Pairs with {@link file://./import-manager.ts | ImportManager}.
 */
import { isErr, ok, type Result } from "@telemax/core";
import type { Document } from "./domain/document.js";
import type { DocumentMetadata } from "./domain/metadata.js";
import type { KnowledgeError } from "./errors.js";
import type { KnowledgeRepository } from "./interfaces.js";
import type { ContentFormat, DocumentFilter, StructuredValue } from "./types.js";
import { systemClock, type Clock } from "./utils.js";

/** A serialized document within a bundle. */
export interface SerializedDocument {
  readonly id: string;
  readonly format: ContentFormat;
  readonly content: string;
  readonly version: number;
  readonly checksum: string;
  readonly metadata: DocumentMetadata;
  readonly parsed?: StructuredValue;
}

/** A portable knowledge bundle (schema version 1). */
export interface KnowledgeBundle {
  readonly version: 1;
  readonly exportedAt: string;
  readonly documents: readonly SerializedDocument[];
}

export class ExportManager {
  public constructor(
    private readonly repository: KnowledgeRepository,
    private readonly clock: Clock = systemClock,
  ) {}

  /** Export all documents (optionally filtered) into a bundle. */
  public async export(filter?: DocumentFilter): Promise<Result<KnowledgeBundle, KnowledgeError>> {
    const listed = await this.repository.list(filter);
    if (isErr(listed)) {
      return listed;
    }
    const documents = listed.value.map(serialize);
    return ok({
      version: 1,
      exportedAt: this.clock.now().toISOString(),
      documents,
    });
  }
}

function serialize(document: Document): SerializedDocument {
  return {
    id: document.id,
    format: document.format,
    content: document.content,
    version: document.version,
    checksum: document.checksum,
    metadata: document.metadata,
    ...(document.parsed !== undefined ? { parsed: document.parsed } : {}),
  };
}

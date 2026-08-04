/**
 * The {@link Document} entity — an immutable value object representing a single
 * unit of knowledge (text content, structured parse, metadata and version).
 */
import { checksum } from "../utils.js";
import type { ContentFormat, DocumentId, StructuredValue } from "../types.js";
import type { DocumentMetadata } from "./metadata.js";

/** Full construction properties for a {@link Document}. */
export interface DocumentProps {
  readonly id: DocumentId;
  readonly format: ContentFormat;
  readonly content: string;
  readonly metadata: DocumentMetadata;
  readonly version: number;
  readonly checksum: string;
  readonly parsed?: StructuredValue;
}

/** Input accepted by {@link Document.create}. */
export interface DocumentInput {
  readonly id: DocumentId;
  readonly format: ContentFormat;
  readonly content: string;
  readonly metadata: DocumentMetadata;
  readonly version?: number;
  readonly parsed?: StructuredValue;
}

/** An immutable knowledge document. */
export class Document {
  public readonly id: DocumentId;
  public readonly format: ContentFormat;
  public readonly content: string;
  public readonly metadata: DocumentMetadata;
  public readonly version: number;
  public readonly checksum: string;
  public readonly parsed?: StructuredValue;

  private constructor(props: DocumentProps) {
    this.id = props.id;
    this.format = props.format;
    this.content = props.content;
    this.metadata = props.metadata;
    this.version = props.version;
    this.checksum = props.checksum;
    if (props.parsed !== undefined) {
      this.parsed = props.parsed;
    }
  }

  /** Create a document, computing its checksum and defaulting version to 1. */
  public static create(input: DocumentInput): Document {
    return new Document({
      id: input.id,
      format: input.format,
      content: input.content,
      metadata: input.metadata,
      version: input.version ?? 1,
      checksum: checksum(input.content),
      ...(input.parsed !== undefined ? { parsed: input.parsed } : {}),
    });
  }

  /** Return a copy with new metadata (content/version unchanged). */
  public withMetadata(metadata: DocumentMetadata): Document {
    return Document.create({
      id: this.id,
      format: this.format,
      content: this.content,
      metadata,
      version: this.version,
      ...(this.parsed !== undefined ? { parsed: this.parsed } : {}),
    });
  }

  /** Return a copy carrying the given version number. */
  public withVersion(version: number): Document {
    return Document.create({
      id: this.id,
      format: this.format,
      content: this.content,
      metadata: this.metadata,
      version,
      ...(this.parsed !== undefined ? { parsed: this.parsed } : {}),
    });
  }
}

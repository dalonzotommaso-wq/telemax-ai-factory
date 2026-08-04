/**
 * Abstract base for text loaders.
 *
 * Applies the Template-Method pattern: the base handles the shared work
 * (format check, id derivation, metadata assembly, {@link Document} creation),
 * and each concrete loader only implements {@link KnowledgeLoaderBase.extract}.
 * Collaborators (clock, id generator) are injected for testability (DI).
 */
import { err, isErr, ok, type Result } from "@telemax/core";
import { createMetadata, type MetadataInput } from "../domain/metadata.js";
import { Document } from "../domain/document.js";
import { UnsupportedFormatError, type KnowledgeError } from "../errors.js";
import type { KnowledgeLoader } from "../interfaces.js";
import {
  asDocumentId,
  type ContentFormat,
  type RawDocument,
  type StructuredValue,
} from "../types.js";
import { slugify, systemClock, uuidIdGenerator, type Clock, type IdGenerator } from "../utils.js";

/** The normalized result a concrete loader extracts from raw content. */
export interface ExtractResult {
  readonly content: string;
  readonly parsed?: StructuredValue;
  readonly metadata?: MetadataInput;
}

/** Dependencies shared by text loaders. */
export interface LoaderDeps {
  readonly clock?: Clock;
  readonly idGenerator?: IdGenerator;
  readonly defaultLanguage?: string;
}

/** Base class implementing the shared loader workflow. */
export abstract class KnowledgeLoaderBase implements KnowledgeLoader {
  public abstract readonly formats: readonly ContentFormat[];

  protected readonly clock: Clock;
  protected readonly idGenerator: IdGenerator;
  protected readonly defaultLanguage: string;

  public constructor(deps?: LoaderDeps) {
    this.clock = deps?.clock ?? systemClock;
    this.idGenerator = deps?.idGenerator ?? uuidIdGenerator;
    this.defaultLanguage = deps?.defaultLanguage ?? "en";
  }

  public supports(format: ContentFormat): boolean {
    return this.formats.includes(format);
  }

  public load(raw: RawDocument): Promise<Result<Document, KnowledgeError>> {
    if (!this.supports(raw.format)) {
      return Promise.resolve(
        err(new UnsupportedFormatError(`Loader does not support format "${raw.format}".`)),
      );
    }
    const extracted = this.extract(raw);
    if (isErr(extracted)) {
      return Promise.resolve(extracted);
    }
    const now = this.clock.now().toISOString();
    const metadata = createMetadata(extracted.value.metadata ?? {}, now, this.defaultLanguage);
    const document = Document.create({
      id: asDocumentId(this.deriveId(raw.ref)),
      format: raw.format,
      content: extracted.value.content,
      metadata,
      ...(extracted.value.parsed !== undefined ? { parsed: extracted.value.parsed } : {}),
    });
    return Promise.resolve(ok(document));
  }

  /** Concrete loaders parse the raw content into an {@link ExtractResult}. */
  protected abstract extract(raw: RawDocument): Result<ExtractResult, KnowledgeError>;

  private deriveId(ref: string): string {
    const slug = slugify(ref);
    return slug.length > 0 ? slug : this.idGenerator.next();
  }
}

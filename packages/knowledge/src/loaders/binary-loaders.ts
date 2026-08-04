/**
 * Prepared binary loaders.
 *
 * PDF and image support is scaffolded so the pipeline recognizes these formats,
 * but extraction is not yet implemented. Both loaders return a
 * {@link NotImplementedError}; concrete extraction will be provided by future
 * adapters without changing the engine.
 */
import { err, type Result } from "@telemax/core";
import { NotImplementedError, type KnowledgeError } from "../errors.js";
import type { Document } from "../domain/document.js";
import type { KnowledgeLoader } from "../interfaces.js";
import type { ContentFormat, RawDocument } from "../types.js";

/** Prepared-only loader for PDF documents. */
export class PdfLoader implements KnowledgeLoader {
  public readonly formats: readonly ContentFormat[] = ["pdf"];

  public supports(format: ContentFormat): boolean {
    return this.formats.includes(format);
  }

  public load(_raw: RawDocument): Promise<Result<Document, KnowledgeError>> {
    return Promise.resolve(
      err(new NotImplementedError("PDF extraction is prepared but not yet implemented.")),
    );
  }
}

/** Prepared-only loader for image documents. */
export class ImageLoader implements KnowledgeLoader {
  public readonly formats: readonly ContentFormat[] = ["image"];

  public supports(format: ContentFormat): boolean {
    return this.formats.includes(format);
  }

  public load(_raw: RawDocument): Promise<Result<Document, KnowledgeError>> {
    return Promise.resolve(
      err(new NotImplementedError("Image extraction is prepared but not yet implemented.")),
    );
  }
}

/**
 * {@link KnowledgeRegistry} — the extension point for loaders and sources.
 * Loaders are registered per {@link ContentFormat}; sources by id. This is how
 * new formats and providers are added without modifying the service.
 */
import { err, ok, type Result } from "@telemax/core";
import { KnowledgeDuplicateError, UnsupportedFormatError, type KnowledgeError } from "./errors.js";
import type { KnowledgeLoader, KnowledgeSource } from "./interfaces.js";
import type { ContentFormat } from "./types.js";

export class KnowledgeRegistry {
  private readonly loaders = new Map<ContentFormat, KnowledgeLoader>();
  private readonly sources = new Map<string, KnowledgeSource>();

  /** Register a loader for each of its declared formats. */
  public registerLoader(loader: KnowledgeLoader): void {
    for (const format of loader.formats) {
      if (this.loaders.has(format)) {
        throw new KnowledgeDuplicateError(`A loader is already registered for "${format}".`);
      }
      this.loaders.set(format, loader);
    }
  }

  /** Resolve the loader for a format, or an {@link UnsupportedFormatError}. */
  public loaderFor(format: ContentFormat): Result<KnowledgeLoader, KnowledgeError> {
    const loader = this.loaders.get(format);
    if (loader === undefined) {
      return err(new UnsupportedFormatError(`No loader registered for format "${format}".`));
    }
    return ok(loader);
  }

  /** Register a named source. */
  public registerSource(source: KnowledgeSource): void {
    if (this.sources.has(source.id)) {
      throw new KnowledgeDuplicateError(`A source is already registered with id "${source.id}".`);
    }
    this.sources.set(source.id, source);
  }

  /** List all registered sources. */
  public listSources(): readonly KnowledgeSource[] {
    return [...this.sources.values()];
  }

  /** Formats that currently have a registered loader. */
  public supportedFormats(): readonly ContentFormat[] {
    return [...this.loaders.keys()];
  }
}

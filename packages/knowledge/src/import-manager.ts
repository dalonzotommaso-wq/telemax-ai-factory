/**
 * {@link ImportManager} — rebuilds documents from a {@link KnowledgeBundle},
 * validates each, and persists them. Emits `import.completed` when done.
 */
import { err, isErr, ok, type Result } from "@telemax/core";
import { Document } from "./domain/document.js";
import { KnowledgeIoError, type KnowledgeError } from "./errors.js";
import { asDocumentId } from "./types.js";
import type { KnowledgeBundle } from "./export-manager.js";
import type { EventBus, KnowledgeEvents } from "./events.js";
import type { KnowledgeRepository } from "./interfaces.js";
import type { KnowledgeValidator } from "./validator.js";

export class ImportManager {
  public constructor(
    private readonly repository: KnowledgeRepository,
    private readonly validator: KnowledgeValidator,
    private readonly events: EventBus<KnowledgeEvents>,
  ) {}

  /** Import a bundle, validating and saving every document. */
  public async import(
    bundle: KnowledgeBundle,
  ): Promise<Result<readonly Document[], KnowledgeError>> {
    if (bundle.version !== 1) {
      return err(new KnowledgeIoError(`Unsupported bundle version: ${String(bundle.version)}.`));
    }
    const saved: Document[] = [];
    for (const entry of bundle.documents) {
      const document = Document.create({
        id: asDocumentId(entry.id),
        format: entry.format,
        content: entry.content,
        metadata: entry.metadata,
        version: entry.version,
        ...(entry.parsed !== undefined ? { parsed: entry.parsed } : {}),
      });
      const validated = this.validator.validate(document);
      if (isErr(validated)) {
        this.events.emit("knowledge.error", { error: validated.error });
        return validated;
      }
      const result = await this.repository.save(document);
      if (isErr(result)) {
        return result;
      }
      saved.push(result.value);
    }
    this.events.emit("import.completed", { imported: saved.length });
    return ok(saved);
  }
}

/**
 * {@link ImportManager} — rebuilds templates from a {@link PromptBundle},
 * revalidates and persists them, then emits `import.completed`.
 */
import { err, isErr, ok, type Result } from "@telemax/core";
import { PromptTemplate } from "./domain/template.js";
import { PromptIoError, type PromptError } from "./errors.js";
import { asTemplateId } from "./types.js";
import type { PromptBundle } from "./export-manager.js";
import type { EventBus, PromptEvents } from "./events.js";
import type { TemplateRepository } from "./interfaces.js";
import type { PromptValidator } from "./validator.js";

export class ImportManager {
  public constructor(
    private readonly repository: TemplateRepository,
    private readonly validator: PromptValidator,
    private readonly events: EventBus<PromptEvents>,
  ) {}

  public async import(
    bundle: PromptBundle,
  ): Promise<Result<readonly PromptTemplate[], PromptError>> {
    if (bundle.version !== 1) {
      return err(new PromptIoError(`Unsupported bundle version: ${String(bundle.version)}.`));
    }
    const saved: PromptTemplate[] = [];
    for (const entry of bundle.templates) {
      const template = PromptTemplate.create({
        id: asTemplateId(entry.id),
        name: entry.name,
        body: entry.body,
        format: entry.format,
        variables: entry.variables,
        metadata: entry.metadata,
        version: entry.version,
        dependencies: entry.dependencies.map(asTemplateId),
        locales: entry.locales,
        ...(entry.role !== undefined ? { role: entry.role } : {}),
        ...(entry.extendsId !== undefined ? { extendsId: asTemplateId(entry.extendsId) } : {}),
      });
      const validated = this.validator.validate(template);
      if (isErr(validated)) {
        this.events.emit("prompt.error", { error: validated.error });
        return validated;
      }
      const result = await this.repository.save(template);
      if (isErr(result)) {
        return result;
      }
      saved.push(result.value);
    }
    this.events.emit("import.completed", { imported: saved.length });
    return ok(saved);
  }
}

/** {@link GeneratorTemplateRepository} — stores and resolves output templates. */
import { err, ok, type Result } from "@telemax/core";
import type { GeneratorTemplate } from "../domain/template.js";
import { TemplateNotFoundError, type GeneratorError } from "../errors.js";

export class GeneratorTemplateRepository {
  private readonly templates = new Map<string, GeneratorTemplate>();

  public register(template: GeneratorTemplate): void {
    this.templates.set(template.id, template);
  }

  public get(id: string): Result<GeneratorTemplate, GeneratorError> {
    const found = this.templates.get(id);
    return found === undefined
      ? err(new TemplateNotFoundError(`Template "${id}" is not registered.`))
      : ok(found);
  }

  public has(id: string): boolean {
    return this.templates.has(id);
  }

  public list(): readonly GeneratorTemplate[] {
    return [...this.templates.values()];
  }
}

/** {@link DefaultTemplateRenderer} — `{{var}}` interpolation, dependency-free. */
import { ok, type Result } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import type { GeneratorTemplate } from "../domain/template.js";
import type { GeneratorError } from "../errors.js";
import type { TemplateRenderer } from "../interfaces.js";
import { interpolate } from "../utils.js";

export class DefaultTemplateRenderer implements TemplateRenderer {
  public render(
    template: GeneratorTemplate,
    variables: Readonly<Record<string, StructuredValue>>,
  ): Result<string, GeneratorError> {
    return ok(interpolate(template.body, variables));
  }
}

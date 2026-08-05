/** {@link ImportManager} — re-registers generators from a {@link GeneratorBundle}. */
import { err, isErr, ok, type Result } from "@telemax/core";
import type { Generator, GeneratorDefinition } from "./domain/definition.js";
import { GeneratorIoError, type GeneratorError } from "./errors.js";
import type { GeneratorBundle } from "./export-manager.js";

export class ImportManager {
  public constructor(
    private readonly register: (
      definition: GeneratorDefinition,
    ) => Result<Generator, GeneratorError>,
  ) {}

  public import(bundle: GeneratorBundle): Result<readonly Generator[], GeneratorError> {
    if (bundle.version !== 1) {
      return err(new GeneratorIoError(`Unsupported bundle version: ${String(bundle.version)}.`));
    }
    const saved: Generator[] = [];
    for (const definition of bundle.generators) {
      const result = this.register(definition);
      if (isErr(result)) {
        return result;
      }
      saved.push(result.value);
    }
    return ok(saved);
  }
}

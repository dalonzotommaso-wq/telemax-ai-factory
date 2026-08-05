/** {@link ExportManager} — serializes generator definitions into a portable bundle. */
import type { GeneratorDefinition } from "./domain/definition.js";
import { systemClock, type Clock } from "./utils.js";

/** A portable generator bundle (schema version 1). */
export interface GeneratorBundle {
  readonly version: 1;
  readonly exportedAt: string;
  readonly generators: readonly GeneratorDefinition[];
}

export class ExportManager {
  public constructor(private readonly clock: Clock = systemClock) {}

  public export(definitions: readonly GeneratorDefinition[]): GeneratorBundle {
    return {
      version: 1,
      exportedAt: this.clock.now().toISOString(),
      generators: [...definitions],
    };
  }
}

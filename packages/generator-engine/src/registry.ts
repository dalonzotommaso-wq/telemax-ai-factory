/** {@link GeneratorRegistry} — stores compiled generators with version history. */
import { err, ok, type Result } from "@telemax/core";
import type { Generator } from "./domain/definition.js";
import type { GeneratorVersion } from "./domain/version.js";
import { GeneratorNotFoundError, type GeneratorError } from "./errors.js";
import type { GeneratorId } from "./types.js";
import { systemClock, type Clock } from "./utils.js";

export class GeneratorRegistry {
  private readonly generators = new Map<string, Generator>();
  private readonly history = new Map<string, GeneratorVersion[]>();

  public constructor(
    private readonly enableVersioning = true,
    private readonly clock: Clock = systemClock,
  ) {}

  public save(generator: Generator): void {
    if (this.enableVersioning) {
      const snapshots = this.history.get(generator.id) ?? [];
      snapshots.push({
        generatorId: generator.id,
        version: generator.version,
        signature: generator.signature,
        checksum: generator.checksum,
        createdAt: this.clock.now().toISOString(),
      });
      this.history.set(generator.id, snapshots);
    }
    this.generators.set(generator.id, generator);
  }

  public get(id: GeneratorId): Result<Generator, GeneratorError> {
    const found = this.generators.get(id);
    return found === undefined
      ? err(new GeneratorNotFoundError(`Generator "${id}" not found.`))
      : ok(found);
  }

  public has(id: GeneratorId): boolean {
    return this.generators.has(id);
  }

  public list(): readonly Generator[] {
    return [...this.generators.values()];
  }

  public versions(id: GeneratorId): readonly GeneratorVersion[] {
    return this.history.get(id) ?? [];
  }
}

/** {@link InMemoryArtifactWriter} — records written artifacts for inspection. */
import { ok, type Result } from "@telemax/core";
import type { GeneratorArtifact } from "../domain/artifact.js";
import type { GeneratorError } from "../errors.js";
import type { ArtifactWriter } from "../interfaces.js";

export class InMemoryArtifactWriter implements ArtifactWriter {
  private readonly written = new Map<string, GeneratorArtifact>();

  public write(artifact: GeneratorArtifact): Result<void, GeneratorError> {
    this.written.set(artifact.path, artifact);
    return ok(undefined);
  }

  public get(path: string): GeneratorArtifact | undefined {
    return this.written.get(path);
  }

  public list(): readonly GeneratorArtifact[] {
    return [...this.written.values()];
  }
}

/**
 * Generated artifacts. {@link GeneratorArtifact} is a single produced output;
 * {@link ArtifactCollection} accumulates them; {@link GeneratorOutput} is a
 * serializable snapshot with a manifest.
 */
import type { ArtifactEncoding } from "../types.js";

/** A single generated artifact (in-memory; persistence is an ArtifactWriter's job). */
export interface GeneratorArtifact {
  readonly path: string;
  readonly content: string;
  readonly contentType: string;
  readonly encoding: ArtifactEncoding;
}

/** A serializable snapshot of an artifact collection. */
export interface GeneratorOutput {
  readonly artifacts: readonly GeneratorArtifact[];
  readonly manifest: Readonly<Record<string, string>>;
}

/** An ordered, path-keyed collection of artifacts (last write wins per path). */
export class ArtifactCollection {
  private readonly items = new Map<string, GeneratorArtifact>();

  public add(artifact: GeneratorArtifact): void {
    this.items.set(artifact.path, artifact);
  }

  public get(path: string): GeneratorArtifact | undefined {
    return this.items.get(path);
  }

  public has(path: string): boolean {
    return this.items.has(path);
  }

  public list(): readonly GeneratorArtifact[] {
    return [...this.items.values()];
  }

  public get size(): number {
    return this.items.size;
  }

  public toOutput(): GeneratorOutput {
    const artifacts = this.list();
    const manifest: Record<string, string> = {};
    for (const artifact of artifacts) {
      manifest[artifact.path] = artifact.contentType;
    }
    return { artifacts, manifest };
  }
}

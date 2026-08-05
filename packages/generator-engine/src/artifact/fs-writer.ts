/**
 * {@link FileSystemArtifactWriter} — an {@link ArtifactWriter} that persists
 * artifacts to disk under a fixed root directory. Paths are confined to the root
 * (path-traversal is refused). Used to materialize a generated project on disk.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { err, ok, type Result } from "@telemax/core";
import type { GeneratorArtifact } from "../domain/artifact.js";
import { GeneratorIoError, type GeneratorError } from "../errors.js";
import type { ArtifactWriter } from "../interfaces.js";

export class FileSystemArtifactWriter implements ArtifactWriter {
  private readonly root: string;
  private readonly written: string[] = [];

  public constructor(rootDir: string) {
    this.root = resolve(rootDir);
  }

  /** Absolute output root directory. */
  public get rootDir(): string {
    return this.root;
  }

  /** Relative paths written so far, in write order. */
  public writtenPaths(): readonly string[] {
    return [...this.written];
  }

  public write(artifact: GeneratorArtifact): Result<void, GeneratorError> {
    const target = resolve(this.root, artifact.path);
    const rel = relative(this.root, target);
    if (rel.length === 0 || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
      return err(
        new GeneratorIoError(`Refusing to write outside the output root: "${artifact.path}".`),
      );
    }
    try {
      mkdirSync(dirname(target), { recursive: true });
      const data =
        artifact.encoding === "base64" ? Buffer.from(artifact.content, "base64") : artifact.content;
      writeFileSync(target, data);
      this.written.push(artifact.path);
      return ok(undefined);
    } catch (cause) {
      return err(new GeneratorIoError(`Failed to write artifact "${artifact.path}".`, { cause }));
    }
  }
}

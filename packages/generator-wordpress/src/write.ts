/**
 * Persist a generated WordPress News project to disk and write a per-artifact
 * manifest (`.telemax/manifest.json`) carrying metadata, version and checksum.
 */
import { createHash } from "node:crypto";
import { isErr, ok, type Result } from "@telemax/core";
import {
  FileSystemArtifactWriter,
  type GeneratorArtifact,
  type GeneratorError,
} from "@telemax/generator-engine";
import { GENERATOR_VERSION } from "./variables.js";
import { WORDPRESS_NEWS_GENERATOR } from "./generator.js";

/** One entry of the written-project manifest. */
export interface ArtifactManifestEntry {
  readonly path: string;
  readonly contentType: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly version: string;
}

/** Summary of a project written to disk. */
export interface WrittenProject {
  readonly outputDir: string;
  readonly files: readonly string[];
  readonly manifestPath: string;
  readonly generatedAt: string;
  readonly fileCount: number;
}

/** Write every artifact under `outputDir`, then a metadata manifest. */
export function writeProject(
  artifacts: readonly GeneratorArtifact[],
  outputDir: string,
  meta: { readonly generatedAt: string },
): Result<WrittenProject, GeneratorError> {
  const writer = new FileSystemArtifactWriter(outputDir);
  const entries: ArtifactManifestEntry[] = [];

  for (const artifact of artifacts) {
    const written = writer.write(artifact);
    if (isErr(written)) {
      return written;
    }
    const bytes = Buffer.byteLength(
      artifact.content,
      artifact.encoding === "base64" ? "base64" : "utf8",
    );
    const sha256 = createHash("sha256").update(artifact.content).digest("hex");
    entries.push({
      path: artifact.path,
      contentType: artifact.contentType,
      bytes,
      sha256,
      version: GENERATOR_VERSION,
    });
  }

  const manifest = {
    generator: WORDPRESS_NEWS_GENERATOR,
    generatorVersion: GENERATOR_VERSION,
    generatedAt: meta.generatedAt,
    fileCount: entries.length,
    artifacts: [...entries].sort((a, b) => a.path.localeCompare(b.path)),
  };
  const manifestArtifact: GeneratorArtifact = {
    path: ".telemax/manifest.json",
    content: `${JSON.stringify(manifest, null, 2)}\n`,
    contentType: "application/json",
    encoding: "utf-8",
  };
  const manifestWritten = writer.write(manifestArtifact);
  if (isErr(manifestWritten)) {
    return manifestWritten;
  }

  return ok({
    outputDir: writer.rootDir,
    files: writer.writtenPaths(),
    manifestPath: ".telemax/manifest.json",
    generatedAt: meta.generatedAt,
    fileCount: writer.writtenPaths().length,
  });
}

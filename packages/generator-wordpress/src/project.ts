/**
 * High-level project generation: generate the WordPress News artifacts and write
 * the complete project to disk.
 */
import { isErr, type Result } from "@telemax/core";
import type { GeneratorError } from "@telemax/generator-engine";
import { generateWordPressNews } from "./runner.js";
import { writeProject, type WrittenProject } from "./write.js";
import type { WordPressError } from "./errors.js";
import type { WordPressSiteConfig } from "./types.js";

/** Options for {@link generateWordPressNewsProject}. */
export interface GenerateProjectOptions {
  readonly outputDir?: string;
  readonly year?: number;
  readonly generatedAt?: string;
}

/** Default output directory for the demo CLI. */
export const DEFAULT_OUTPUT_DIR = "output/wordpress-news";

/** Generate the project and write it under `outputDir` (default `output/wordpress-news`). */
export async function generateWordPressNewsProject(
  input: WordPressSiteConfig,
  options: GenerateProjectOptions = {},
): Promise<Result<WrittenProject, WordPressError | GeneratorError>> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const result = await generateWordPressNews(input, {
    generatedAt,
    ...(options.year !== undefined ? { year: options.year } : {}),
  });
  if (isErr(result)) {
    return result;
  }
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  return writeProject(result.value.artifacts.list(), outputDir, { generatedAt });
}

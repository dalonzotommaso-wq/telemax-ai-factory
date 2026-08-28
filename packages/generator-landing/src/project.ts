/**
 * High-level project generation: generate the Landing Page artifacts and write
 * the complete project to disk.
 */
import { isErr, type Result } from "@telemax/core";
import type { GeneratorError } from "@telemax/generator-engine";
import { generateLandingPage } from "./runner.js";
import { writeProject, type WrittenProject } from "./write.js";
import type { LandingPageError } from "./errors.js";
import type { LandingPageConfig } from "./types.js";

/** Options for {@link generateLandingPageProject}. */
export interface GenerateProjectOptions {
  readonly outputDir?: string;
  readonly year?: number;
  readonly generatedAt?: string;
}

/** Default output directory for standalone generation. */
export const DEFAULT_OUTPUT_DIR = "output/landing-page";

/** Generate the project and write it under `outputDir` (default `output/landing-page`). */
export async function generateLandingPageProject(
  input: LandingPageConfig,
  options: GenerateProjectOptions = {},
): Promise<Result<WrittenProject, LandingPageError | GeneratorError>> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const result = await generateLandingPage(input, {
    generatedAt,
    ...(options.year !== undefined ? { year: options.year } : {}),
  });
  if (isErr(result)) {
    return result;
  }
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  return writeProject(result.value.artifacts.list(), outputDir, { generatedAt });
}

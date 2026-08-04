/**
 * High-level entry point: validate, wire every engine, register the generator and
 * produce the WordPress News project artifacts.
 */
import { GeneratorEngine } from "@telemax/generator-engine";
import type { GeneratorError, GeneratorResult } from "@telemax/generator-engine";
import { WorkflowEngine } from "@telemax/workflow";
import { isErr, type Result } from "@telemax/core";
import { resolveWordPressConfig } from "./config.js";
import { registerWordPressNews } from "./di.js";
import { seedKnowledge } from "./knowledge.js";
import { buildPromptEngine } from "./prompts.js";
import { assembleVariables } from "./assemble.js";
import { validateProject } from "./validation-engine.js";
import { WORDPRESS_NEWS_GENERATOR } from "./generator.js";
import type { WordPressError } from "./errors.js";
import type { WordPressSiteConfig } from "./types.js";

/** Options for {@link generateWordPressNews}. */
export interface GenerateOptions {
  readonly year?: number;
  readonly generatedAt?: string;
}

/** Validate the config, wire the engines and generate the project artifacts. */
export async function generateWordPressNews(
  input: WordPressSiteConfig,
  options: GenerateOptions = {},
): Promise<Result<GeneratorResult, WordPressError | GeneratorError>> {
  const validation = validateProject(input);
  if (isErr(validation)) {
    return validation;
  }
  const config = resolveWordPressConfig(input);

  const generator = new GeneratorEngine();
  const workflow = new WorkflowEngine();
  const prompt = await buildPromptEngine();
  const knowledge = await seedKnowledge();

  const registered = registerWordPressNews({ generator, workflow, prompt, knowledge }, config);
  if (isErr(registered)) {
    return registered;
  }

  const year = options.year ?? new Date().getFullYear();
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  return generator.generate(WORDPRESS_NEWS_GENERATOR, assembleVariables(config, year, generatedAt));
}

// -----------------------------------------------------------------------------
// GeneratorAdapter — the contract the GenerationService dispatches to.
//
// Each concrete generator package (`@telemax/generator-wordpress`,
// `@telemax/generator-landing`, …) is wrapped by one adapter. The adapter owns
// the generator-specific wiring (config, engines, register, produce + write
// artifacts); the GenerationService owns the generic tail (record files, package
// the ZIP, persist the generation row).
// -----------------------------------------------------------------------------
import type { Project } from "../../domain.js";

/** The subset of `workspace/<slug>/project.json` the generators read. */
export interface ProjectManifest {
  name?: string;
  slug?: string;
  generator?: string;
  workflow?: string;
  knowledgePack?: string;
  aiProvider?: string;
  type?: string;
}

/** Content Plan provenance, surfaced in the generation log for observability. */
export interface ContentPlanObservability {
  readonly source: "generated" | "fallback";
  readonly validation: "passed" | "failed";
}

/** Everything an adapter needs to run one generation. */
export interface GeneratorRunContext {
  readonly project: Project;
  readonly manifest: ProjectManifest;
  /** Absolute directory the artifacts must be written to (`workspace/<slug>/output`). */
  readonly outputDir: string;
  readonly generatedAt: string;
  readonly year: number;
  /** Append a line to the generation log under a phase key. */
  readonly log: (phase: string, message: string) => void;
}

/** What an adapter reports back after a successful run. */
export interface GeneratorRunResult {
  readonly fileCount: number;
  readonly contentPlan: ContentPlanObservability;
}

/** A runnable generator, selected by project type / installed generator id. */
export interface GeneratorAdapter {
  /** Stable id, e.g. `"wordpress-news"` or `"landing-page"`. */
  readonly id: string;
  /** True when this adapter should handle the given project. */
  matches(project: Project, manifest: ProjectManifest): boolean;
  /** Wire the engines, register the generator, produce and write the artifacts. */
  run(ctx: GeneratorRunContext): Promise<GeneratorRunResult>;
}

/** Resolve the installed-generator id from the manifest, falling back to the project. */
export function generatorIdOf(project: Project, manifest: ProjectManifest): string {
  return manifest.generator || project.generator || "";
}

/** Resolve the effective project type from the manifest, falling back to the project. */
export function projectTypeOf(project: Project, manifest: ProjectManifest): string {
  return manifest.type ?? project.type;
}

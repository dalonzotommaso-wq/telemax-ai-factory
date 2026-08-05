/**
 * Core value types for the Generator Engine. Pure data only; behavioral
 * contracts live in {@link file://./interfaces.ts}. The engine is completely
 * target-agnostic — it knows nothing about WordPress, React, Flutter, etc.
 */
import type { Branded } from "@telemax/core";

/** Nominal identifier for a generator. */
export type GeneratorId = Branded<string, "GeneratorId">;

/** Lifecycle state of a generation run. */
export type GeneratorState = "pending" | "running" | "completed" | "failed";

/** Kinds of generator pipeline step. */
export type StepKind = "template" | "emit" | "transform" | "workflow" | "prompt" | "ai";

/** Artifact content encoding. */
export type ArtifactEncoding = "utf-8" | "base64";

/** A generation target. Free-form string — the engine never branches on it. */
export type TargetKind = string;

/**
 * Foreseen target kinds. Documentation/registry convention only; the engine is
 * target-agnostic and never inspects these values.
 */
export const GENERATOR_TARGETS: readonly string[] = [
  "wordpress",
  "react",
  "nextjs",
  "laravel",
  "flutter",
  "desktop",
  "api",
  "saas",
  "crm",
  "erp",
];

/** Brand a raw string as a {@link GeneratorId}. */
export function asGeneratorId(value: string): GeneratorId {
  return value as GeneratorId;
}

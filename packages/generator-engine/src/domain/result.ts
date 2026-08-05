/** The outcome of a generation run. */
import type { StructuredValue } from "@telemax/knowledge";
import type { GeneratorId, GeneratorState } from "../types.js";
import type { ArtifactCollection } from "./artifact.js";

export interface GeneratorResult {
  readonly generatorId: GeneratorId;
  readonly runId: string;
  readonly state: GeneratorState;
  readonly artifacts: ArtifactCollection;
  readonly variables: Readonly<Record<string, StructuredValue>>;
  readonly durationMs: number;
  readonly error?: string;
}

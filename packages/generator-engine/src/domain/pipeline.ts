/** An ordered generator pipeline. */
import type { GeneratorStep } from "./step.js";

export interface GeneratorPipeline {
  readonly steps: readonly GeneratorStep[];
}

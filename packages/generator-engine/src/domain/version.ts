/** A version snapshot of a generator. */
import type { GeneratorId } from "../types.js";

export interface GeneratorVersion {
  readonly generatorId: GeneratorId;
  readonly version: number;
  readonly signature: string;
  readonly checksum: string;
  readonly createdAt: string;
}

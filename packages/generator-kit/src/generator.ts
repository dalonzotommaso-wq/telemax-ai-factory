/**
 * Generator contracts.
 *
 * These types define *what a generator is* without prescribing *what it does*.
 * Concrete generators (website, landing page, application, …) are separate
 * packages that implement this contract; none ship in the foundation.
 */
import type { Result } from "@telemax/core";

/** A request to produce artifacts of a given `kind` from typed `input`. */
export interface GenerationRequest {
  /** The kind of artifact to generate (e.g. an identifier a generator claims). */
  readonly kind: string;
  /** Arbitrary, read-only, generator-specific input parameters. */
  readonly input: Readonly<Record<string, unknown>>;
}

/** A single produced artifact: a relative path and its textual contents. */
export interface GeneratedArtifact {
  readonly path: string;
  readonly contents: string;
}

/** The outcome of a successful generation: one or more artifacts. */
export interface GenerationResult {
  readonly artifacts: readonly GeneratedArtifact[];
}

/** The contract every generator implements. */
export interface Generator {
  /** Unique generator name. */
  readonly name: string;
  /** Whether this generator can handle the given artifact `kind`. */
  supports(kind: string): boolean;
  /** Produce artifacts for the request, or a failed {@link Result}. */
  generate(request: GenerationRequest): Promise<Result<GenerationResult, Error>>;
}

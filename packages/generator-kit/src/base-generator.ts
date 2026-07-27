/**
 * Abstract base class for generators.
 *
 * It implements both the {@link Generator} contract and the Core's
 * {@link Plugin} contract, so a generator can be registered directly with the
 * kernel. Common behavior (name/version exposure, `supports`, the
 * `supports`-guard in `generate`) lives here so concrete generators only
 * implement their production logic in {@link BaseGenerator.run}.
 *
 * This package depends on `@telemax/core`; the Core has no knowledge of
 * generators, which enforces the one-way dependency direction (generators ->
 * core) mandated by the architecture.
 */
import { err, type Plugin, type PluginContext, type Result } from "@telemax/core";
import type { GenerationRequest, GenerationResult, Generator } from "./generator.js";

export abstract class BaseGenerator implements Generator, Plugin {
  /** Unique generator name; provided by the concrete subclass. */
  public abstract readonly name: string;

  /** Semantic version; subclasses may override the default. */
  public readonly version: string = "0.1.0";

  /** The artifact kinds this generator can produce. */
  protected abstract readonly kinds: readonly string[];

  public supports(kind: string): boolean {
    return this.kinds.includes(kind);
  }

  /** Plugin lifecycle hook: log registration. Subclasses may extend. */
  public setup(context: PluginContext): void {
    context.logger.debug("Generator registered", { generator: this.name });
  }

  public generate(request: GenerationRequest): Promise<Result<GenerationResult, Error>> {
    if (!this.supports(request.kind)) {
      return Promise.resolve(
        err(new Error(`Generator "${this.name}" does not support kind "${request.kind}".`)),
      );
    }
    return this.run(request);
  }

  /** Concrete production logic, implemented by each generator. */
  protected abstract run(request: GenerationRequest): Promise<Result<GenerationResult, Error>>;
}

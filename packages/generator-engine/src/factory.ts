/**
 * {@link GeneratorFactory} — validates a {@link GeneratorDefinition} and compiles
 * it into an immutable {@link Generator} (checksum + version signature).
 */
import { isErr, ok, type Result } from "@telemax/core";
import { createGeneratorMetadata } from "./domain/metadata.js";
import { Generator, type GeneratorDefinition } from "./domain/definition.js";
import type { GeneratorConfiguration } from "./config.js";
import type { GeneratorError } from "./errors.js";
import { asGeneratorId } from "./types.js";
import { GeneratorValidator } from "./validator.js";
import { systemClock, type Clock } from "./utils.js";

export class GeneratorFactory {
  public constructor(
    private readonly validator: GeneratorValidator = new GeneratorValidator(),
    private readonly clock: Clock = systemClock,
    private readonly defaultLanguage = "en",
    private readonly defaultTarget = "generic",
  ) {}

  public create(definition: GeneratorDefinition): Result<Generator, GeneratorError> {
    const validated = this.validator.validate(definition);
    if (isErr(validated)) {
      return validated;
    }
    const now = this.clock.now().toISOString();
    const configuration: GeneratorConfiguration = definition.configuration ?? {};
    const target = definition.target ?? configuration.target ?? this.defaultTarget;
    const metadata = createGeneratorMetadata(
      { ...(definition.metadata ?? {}), target },
      now,
      this.defaultLanguage,
    );
    const generator = Generator.create({
      id: asGeneratorId(definition.id),
      name: definition.name,
      version: definition.version ?? 1,
      target,
      pipeline: definition.pipeline,
      templates: definition.templates ?? [],
      configuration,
      metadata,
    });
    return ok(generator);
  }
}

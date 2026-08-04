/**
 * Default "prepared" adapters for capabilities not yet implemented. Each returns
 * a {@link PromptNotImplementedError}; real adapters plug in via the same ports.
 */
import { err, type Result } from "@telemax/core";
import type { StructuredValue, StructuredObject } from "@telemax/knowledge";
import { PromptNotImplementedError, type PromptError } from "./errors.js";
import type { RenderedPrompt } from "./domain/message.js";
import type { PromptChainDefinition } from "./domain/advanced.js";
import type { VariableValues } from "./domain/variable.js";
import type { JsonSchemaValidator, PromptChainRunner, RagAugmentor } from "./interfaces.js";

/** Prepared chain runner. */
export class NotImplementedChainRunner implements PromptChainRunner {
  public run(
    _chain: PromptChainDefinition,
    _values: VariableValues,
  ): Promise<Result<RenderedPrompt, PromptError>> {
    return Promise.resolve(
      err(new PromptNotImplementedError("Prompt chains are prepared but not yet implemented.")),
    );
  }
}

/** Prepared RAG augmentor. */
export class NotImplementedRagAugmentor implements RagAugmentor {
  public augment(
    _query: string,
    _values: VariableValues,
  ): Promise<Result<VariableValues, PromptError>> {
    return Promise.resolve(
      err(new PromptNotImplementedError("RAG augmentation is prepared but not yet implemented.")),
    );
  }
}

/** Prepared JSON Schema validator. */
export class NotImplementedJsonSchemaValidator implements JsonSchemaValidator {
  public validate(
    _schema: StructuredObject,
    _value: StructuredValue,
  ): Result<StructuredValue, PromptError> {
    return err(
      new PromptNotImplementedError("JSON Schema validation is prepared but not yet implemented."),
    );
  }
}

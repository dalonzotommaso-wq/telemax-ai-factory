/**
 * Adapter factories that turn the other engines into {@link StepHandler}s, so a
 * workflow can coordinate them. No real providers/generators are used; the AI
 * Orchestrator runs on its local stub in tests.
 */
import { err, isErr, ok } from "@telemax/core";
import type { StructuredObject, StructuredValue } from "@telemax/knowledge";
import type { AIOrchestrator, AIRequest } from "@telemax/ai";
import type { PromptEngine } from "@telemax/prompt-engine";
import { StepExecutionError } from "../errors.js";
import type { StepHandler } from "../interfaces.js";

function asText(value: StructuredValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function asRecord(value: StructuredValue | undefined): StructuredObject | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as StructuredObject;
}

/** A handler that runs the AI Orchestrator and returns the response content. */
export function aiStepHandler(orchestrator: AIOrchestrator): StepHandler {
  return async (input) => {
    const templateId = asText(input["templateId"]);
    const variables = asRecord(input["variables"]);
    const request: AIRequest = {
      input: asText(input["input"]),
      ...(templateId.length > 0 ? { templateId } : {}),
      ...(variables !== undefined ? { variables } : {}),
    };
    const result = await orchestrator.execute(request);
    if (isErr(result)) {
      return err(new StepExecutionError(result.error.message, "ai", { cause: result.error }));
    }
    return ok(result.value.response.content);
  };
}

/** A handler that renders a Prompt Engine template and returns its content. */
export function promptStepHandler(engine: PromptEngine): StepHandler {
  return async (input) => {
    const templateId = asText(input["templateId"]);
    const variables = asRecord(input["variables"]);
    const rendered = await engine.render({
      templateId,
      ...(variables !== undefined ? { variables } : {}),
    });
    if (isErr(rendered)) {
      return err(
        new StepExecutionError(rendered.error.message, "prompt", { cause: rendered.error }),
      );
    }
    return ok(rendered.value.content);
  };
}

/** A handler that retrieves knowledge snippets and returns them joined. */
export function knowledgeStepHandler(
  retrieve: (query: string) => Promise<readonly string[]>,
): StepHandler {
  return async (input) => {
    const snippets = await retrieve(asText(input["query"]));
    return ok(snippets.join("\n"));
  };
}

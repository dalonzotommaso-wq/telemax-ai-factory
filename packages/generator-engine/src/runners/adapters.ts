/**
 * Adapter factories that turn the other engines into coordination runners, so a
 * generator can compose them. No real generators/providers are involved; the AI
 * Orchestrator runs on its local stub in tests.
 */
import { err, isErr, ok } from "@telemax/core";
import type { WorkflowEngine } from "@telemax/workflow";
import type { AIOrchestrator } from "@telemax/ai";
import type { PromptEngine } from "@telemax/prompt-engine";
import { GeneratorStepError } from "../errors.js";
import type { AIRunner, KnowledgeRunner, PromptRunner, WorkflowRunner } from "../interfaces.js";

/** Coordinate the Workflow Engine. */
export function workflowRunner(engine: WorkflowEngine): WorkflowRunner {
  return {
    async run(workflowId, input) {
      const result = await engine.run(workflowId, input);
      if (isErr(result)) {
        return err(
          new GeneratorStepError(result.error.message, workflowId, { cause: result.error }),
        );
      }
      if (result.value.state !== "completed") {
        return err(
          new GeneratorStepError(
            `Workflow "${workflowId}" ended in state ${result.value.state}.`,
            workflowId,
          ),
        );
      }
      return ok(result.value.output);
    },
  };
}

/** Coordinate the AI Orchestrator. */
export function aiRunner(orchestrator: AIOrchestrator): AIRunner {
  return {
    async run(request) {
      const result = await orchestrator.execute({
        input: request.input ?? "",
        ...(request.templateId !== undefined ? { templateId: request.templateId } : {}),
        ...(request.variables !== undefined ? { variables: request.variables } : {}),
      });
      if (isErr(result)) {
        return err(new GeneratorStepError(result.error.message, "ai", { cause: result.error }));
      }
      return ok(result.value.response.content);
    },
  };
}

/** Coordinate the Prompt Engine. */
export function promptRunner(engine: PromptEngine): PromptRunner {
  return {
    async render(templateId, variables) {
      const rendered = await engine.render({
        templateId,
        ...(variables !== undefined ? { variables } : {}),
      });
      if (isErr(rendered)) {
        return err(
          new GeneratorStepError(rendered.error.message, "prompt", { cause: rendered.error }),
        );
      }
      return ok(rendered.value.content);
    },
  };
}

/** Coordinate Knowledge retrieval. */
export function knowledgeRunner(
  retrieve: (query: string) => Promise<readonly string[]>,
): KnowledgeRunner {
  return {
    async retrieve(query) {
      return ok(await retrieve(query));
    },
  };
}

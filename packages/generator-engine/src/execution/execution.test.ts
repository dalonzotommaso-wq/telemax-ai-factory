import { err, isErr, ok, type Result } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import { describe, expect, it } from "vitest";
import { GeneratorExecution } from "./execution.js";
import { GeneratorFactory } from "../factory.js";
import { DefaultTemplateRenderer } from "../template/renderer.js";
import { GeneratorTemplateRepository } from "../template/repository.js";
import { GeneratorTransformRegistry } from "../transforms/registry.js";
import { registerBuiltinTransforms } from "../transforms/builtin.js";
import { InMemoryArtifactWriter } from "../artifact/writer.js";
import { GeneratorEventBus } from "../events.js";
import { NoopMetricsSink } from "../metrics.js";
import { GeneratorStepError, type GeneratorError } from "../errors.js";
import type { Generator, GeneratorDefinition } from "../domain/definition.js";
import type { AIRunner, PromptRunner, WorkflowRunner } from "../interfaces.js";

function compile(def: GeneratorDefinition): Generator {
  const result = new GeneratorFactory().create(def);
  if (isErr(result)) {
    throw result.error;
  }
  return result.value;
}

function makeExecution(opts?: {
  readonly templates?: GeneratorTemplateRepository;
  readonly workflow?: WorkflowRunner;
  readonly ai?: AIRunner;
  readonly prompt?: PromptRunner;
}): { execution: GeneratorExecution; writer: InMemoryArtifactWriter } {
  const templates = opts?.templates ?? new GeneratorTemplateRepository();
  const transforms = new GeneratorTransformRegistry();
  registerBuiltinTransforms(transforms);
  const writer = new InMemoryArtifactWriter();
  const execution = new GeneratorExecution({
    templates,
    renderer: new DefaultTemplateRenderer(),
    transforms,
    writer,
    events: new GeneratorEventBus(),
    metrics: new NoopMetricsSink(),
    ...(opts?.workflow !== undefined ? { workflow: opts.workflow } : {}),
    ...(opts?.ai !== undefined ? { ai: opts.ai } : {}),
    ...(opts?.prompt !== undefined ? { prompt: opts.prompt } : {}),
  });
  return { execution, writer };
}

describe("GeneratorExecution", () => {
  it("renders a template into an artifact at an interpolated path", async () => {
    const templates = new GeneratorTemplateRepository();
    templates.register({ id: "greeting", name: "greeting", body: "Hello {{name}}!" });
    const { execution, writer } = makeExecution({ templates });
    const generator = compile({
      id: "g",
      name: "g",
      pipeline: {
        steps: [{ id: "s1", kind: "template", templateId: "greeting", path: "out/{{name}}.txt" }],
      },
    });
    const result = await execution.run(generator, { name: "Ada" });
    expect(result.state).toBe("completed");
    expect(result.artifacts.get("out/Ada.txt")?.content).toBe("Hello Ada!");
    expect(writer.get("out/Ada.txt")?.content).toBe("Hello Ada!");
  });

  it("emits artifacts from a literal and from a variable", async () => {
    const { execution } = makeExecution();
    const generator = compile({
      id: "g",
      name: "g",
      pipeline: {
        steps: [
          { id: "lit", kind: "emit", path: "a.txt", content: "literal {{x}}" },
          { id: "var", kind: "emit", path: "b.txt", fromVariable: "payload" },
        ],
      },
    });
    const result = await execution.run(generator, { x: "X", payload: { a: 1 } });
    expect(result.state).toBe("completed");
    expect(result.artifacts.get("a.txt")?.content).toBe("literal X");
    expect(result.artifacts.get("b.txt")?.content).toBe('{"a":1}');
  });

  it("runs a transform and stores its result in a variable", async () => {
    const { execution } = makeExecution();
    const generator = compile({
      id: "g",
      name: "g",
      pipeline: {
        steps: [
          { id: "t", kind: "transform", transform: "json", input: { a: 1 }, output: "packed" },
        ],
      },
    });
    const result = await execution.run(generator);
    expect(result.state).toBe("completed");
    expect(result.variables["packed"]).toBe('{"a":1}');
  });

  it("fails when a transform is not registered", async () => {
    const { execution } = makeExecution();
    const generator = compile({
      id: "g",
      name: "g",
      pipeline: { steps: [{ id: "t", kind: "transform", transform: "missing", output: "x" }] },
    });
    const result = await execution.run(generator);
    expect(result.state).toBe("failed");
  });

  it("reports NotImplemented for coordination steps without a runner", async () => {
    const { execution } = makeExecution();
    const workflow = await execution.run(
      compile({
        id: "w",
        name: "w",
        pipeline: { steps: [{ id: "wf", kind: "workflow", workflowId: "x", output: "o" }] },
      }),
    );
    expect(workflow.state).toBe("failed");
    const ai = await execution.run(
      compile({
        id: "a",
        name: "a",
        pipeline: { steps: [{ id: "ai", kind: "ai", input: "hi", output: "o" }] },
      }),
    );
    expect(ai.state).toBe("failed");
  });

  it("coordinates injected runners and runs a multi-step pipeline", async () => {
    const workflow: WorkflowRunner = {
      run(): Promise<Result<Readonly<Record<string, StructuredValue>>, GeneratorError>> {
        return Promise.resolve(ok({ built: true }));
      },
    };
    const prompt: PromptRunner = {
      render(): Promise<Result<string, GeneratorError>> {
        return Promise.resolve(ok("rendered-body"));
      },
    };
    const { execution } = makeExecution({ workflow, prompt });
    const generator = compile({
      id: "g",
      name: "g",
      pipeline: {
        steps: [
          { id: "wf", kind: "workflow", workflowId: "wx", output: "wfOut" },
          { id: "pr", kind: "prompt", templateId: "tpl", output: "body" },
          { id: "emit", kind: "emit", path: "index.html", fromVariable: "body" },
        ],
      },
    });
    const result = await execution.run(generator);
    expect(result.state).toBe("completed");
    expect(result.variables["wfOut"]).toEqual({ built: true });
    expect(result.artifacts.get("index.html")?.content).toBe("rendered-body");
  });

  it("propagates a failing runner", async () => {
    const ai: AIRunner = {
      run(): Promise<Result<string, GeneratorError>> {
        return Promise.resolve(err(new GeneratorStepError("boom", "ai")));
      },
    };
    const { execution } = makeExecution({ ai });
    const generator = compile({
      id: "g",
      name: "g",
      pipeline: { steps: [{ id: "ai", kind: "ai", input: "x", output: "o" }] },
    });
    const result = await execution.run(generator);
    expect(result.state).toBe("failed");
  });
});

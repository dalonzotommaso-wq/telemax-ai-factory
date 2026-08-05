import { err, isErr, ok, type Result } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import { describe, expect, it } from "vitest";
import { WorkflowExecutor } from "./executor.js";
import { WorkflowCompiler } from "../compiler.js";
import { DefaultConditionEvaluator } from "../condition/evaluator.js";
import { StepHandlerRegistry } from "../handlers/registry.js";
import { registerBuiltinHandlers } from "../handlers/builtin.js";
import { WorkflowEventBus } from "../events.js";
import { NoopMetricsSink } from "../metrics.js";
import { DEFAULT_WORKFLOW_CONFIG } from "../config.js";
import { StepExecutionError, type WorkflowError } from "../errors.js";
import type { Workflow, WorkflowDefinition } from "../domain/definition.js";
import type { StepHandler } from "../interfaces.js";

function compile(def: WorkflowDefinition): Workflow {
  const result = new WorkflowCompiler().compile(def);
  if (isErr(result)) {
    throw result.error;
  }
  return result.value;
}

function makeExecutor(opts?: {
  readonly handlers?: StepHandlerRegistry;
  readonly resolve?: (id: string) => Workflow | undefined;
}): { executor: WorkflowExecutor; handlers: StepHandlerRegistry } {
  const handlers = opts?.handlers ?? new StepHandlerRegistry();
  registerBuiltinHandlers(handlers);
  const executor = new WorkflowExecutor({
    handlers,
    evaluator: new DefaultConditionEvaluator(),
    events: new WorkflowEventBus(),
    metrics: new NoopMetricsSink(),
    config: DEFAULT_WORKFLOW_CONFIG,
    resolveWorkflow: opts?.resolve ?? ((): undefined => undefined),
  });
  return { executor, handlers };
}

describe("WorkflowExecutor", () => {
  it("runs a sequential workflow and collects outputs", async () => {
    const { executor } = makeExecutor();
    const wf = compile({
      id: "seq",
      name: "seq",
      root: {
        id: "root",
        kind: "sequence",
        steps: [
          { id: "s1", kind: "task", handler: "echo", input: { a: 1 }, output: "first" },
          { id: "s2", kind: "task", handler: "noop" },
        ],
      },
    });
    const result = await executor.run(wf);
    expect(result.state).toBe("completed");
    expect(result.output["first"]).toEqual({ a: 1 });
    expect(result.steps).toHaveLength(2);
  });

  it("merges parallel branch outputs", async () => {
    const { executor } = makeExecutor();
    const wf = compile({
      id: "par",
      name: "par",
      root: {
        id: "root",
        kind: "parallel",
        branches: [
          { id: "p1", kind: "task", handler: "echo", input: { x: 1 }, output: "o1" },
          { id: "p2", kind: "task", handler: "echo", input: { y: 2 }, output: "o2" },
        ],
      },
    });
    const result = await executor.run(wf);
    expect(result.state).toBe("completed");
    expect(result.output["o1"]).toEqual({ x: 1 });
    expect(result.output["o2"]).toEqual({ y: 2 });
  });

  it("takes the else path when a branch condition is false", async () => {
    const { executor } = makeExecutor();
    const wf = compile({
      id: "br",
      name: "br",
      root: {
        id: "root",
        kind: "branch",
        condition: { kind: "var-truthy", variable: "missing" },
        then: [
          { id: "t1", kind: "task", handler: "echo", input: { path: "then" }, output: "chosen" },
        ],
        otherwise: [
          { id: "t2", kind: "task", handler: "echo", input: { path: "else" }, output: "chosen" },
        ],
      },
    });
    const result = await executor.run(wf);
    expect(result.output["chosen"]).toEqual({ path: "else" });
  });

  it("caps loop iterations", async () => {
    const handlers = new StepHandlerRegistry();
    let count = 0;
    const counter: StepHandler = () => {
      count += 1;
      return Promise.resolve<Result<StructuredValue, WorkflowError>>(ok(count));
    };
    handlers.register("count", counter);
    const { executor } = makeExecutor({ handlers });
    const wf = compile({
      id: "loop",
      name: "loop",
      root: {
        id: "root",
        kind: "loop",
        maxIterations: 3,
        body: [{ id: "b", kind: "task", handler: "count" }],
      },
    });
    const result = await executor.run(wf);
    expect(result.state).toBe("completed");
    expect(count).toBe(3);
  });

  it("retries a failing step until it succeeds", async () => {
    const handlers = new StepHandlerRegistry();
    let calls = 0;
    const flaky: StepHandler = () => {
      calls += 1;
      return Promise.resolve<Result<StructuredValue, WorkflowError>>(
        calls < 3 ? err(new StepExecutionError("boom", "t")) : ok("done"),
      );
    };
    handlers.register("flaky", flaky);
    const { executor } = makeExecutor({ handlers });
    const wf = compile({
      id: "retry",
      name: "retry",
      root: {
        id: "t",
        kind: "task",
        handler: "flaky",
        retry: { maxAttempts: 3, baseDelayMs: 0 },
        output: "r",
      },
    });
    const result = await executor.run(wf);
    expect(result.state).toBe("completed");
    expect(result.output["r"]).toBe("done");
    expect(result.steps[0]?.attempts).toBe(3);
  });

  it("fails after exhausting retries", async () => {
    const handlers = new StepHandlerRegistry();
    const always: StepHandler = () =>
      Promise.resolve<Result<StructuredValue, WorkflowError>>(
        err(new StepExecutionError("no", "t")),
      );
    handlers.register("always", always);
    const { executor } = makeExecutor({ handlers });
    const wf = compile({
      id: "fail",
      name: "fail",
      root: { id: "t", kind: "task", handler: "always", retry: { maxAttempts: 2 } },
    });
    const result = await executor.run(wf);
    expect(result.state).toBe("failed");
    expect(result.steps[0]?.state).toBe("failed");
    expect(result.steps[0]?.attempts).toBe(2);
  });

  it("runs compensating handlers on rollback", async () => {
    const handlers = new StepHandlerRegistry();
    const compensated: string[] = [];
    handlers.register("comp", () => {
      compensated.push("comp");
      return Promise.resolve<Result<StructuredValue, WorkflowError>>(ok(null));
    });
    handlers.register("boom", () =>
      Promise.resolve<Result<StructuredValue, WorkflowError>>(
        err(new StepExecutionError("x", "b")),
      ),
    );
    const { executor } = makeExecutor({ handlers });
    const wf = compile({
      id: "rb",
      name: "rb",
      onFailure: "rollback",
      root: {
        id: "root",
        kind: "sequence",
        steps: [
          {
            id: "a",
            kind: "task",
            handler: "echo",
            input: { a: 1 },
            rollback: { handler: "comp" },
          },
          { id: "b", kind: "task", handler: "boom" },
        ],
      },
    });
    const result = await executor.run(wf);
    expect(result.state).toBe("rolled-back");
    expect(compensated).toEqual(["comp"]);
  });

  it("runs a subworkflow and namespaces its outputs", async () => {
    const child = compile({
      id: "child",
      name: "child",
      root: { id: "c", kind: "task", handler: "echo", input: { v: 9 }, output: "cv" },
    });
    const { executor } = makeExecutor({ resolve: (id) => (id === "child" ? child : undefined) });
    const wf = compile({
      id: "parent",
      name: "parent",
      root: { id: "sub", kind: "subworkflow", workflowId: "child", output: "childOut" },
    });
    const result = await executor.run(wf);
    expect(result.state).toBe("completed");
    expect(result.output["childOut"]).toEqual({ cv: { v: 9 } });
  });

  it("reports NotImplemented for prepared approval and tool steps", async () => {
    const { executor } = makeExecutor();
    const approval = await executor.run(
      compile({ id: "ap", name: "ap", root: { id: "a", kind: "approval", prompt: "ok?" } }),
    );
    expect(approval.state).toBe("failed");
    const tool = await executor.run(
      compile({ id: "tl", name: "tl", root: { id: "t", kind: "tool", tool: "x" } }),
    );
    expect(tool.state).toBe("failed");
  });

  it("times out a slow step", async () => {
    const handlers = new StepHandlerRegistry();
    handlers.register("slow", () => {
      return new Promise<Result<StructuredValue, WorkflowError>>((resolve) => {
        setTimeout(() => resolve(ok("late")), 40);
      });
    });
    const { executor } = makeExecutor({ handlers });
    const wf = compile({
      id: "to",
      name: "to",
      root: { id: "t", kind: "task", handler: "slow", timeout: { timeoutMs: 5 } },
    });
    const result = await executor.run(wf);
    expect(result.state).toBe("failed");
  });
});

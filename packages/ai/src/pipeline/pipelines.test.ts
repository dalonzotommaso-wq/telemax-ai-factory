import { isErr } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { KnowledgePipeline, StaticKnowledgeGateway } from "./knowledge-pipeline.js";
import { PromptPipeline } from "./prompt-pipeline.js";
import { ExecutionPipeline } from "./execution-pipeline.js";
import { DefaultRetryPolicy } from "../resilience/retry-policy.js";
import { DefaultCircuitBreaker } from "../resilience/circuit-breaker.js";
import { TokenBucketRateLimiter } from "../resilience/rate-limiter.js";
import { DefaultHealthMonitor } from "../resilience/health-monitor.js";
import { StubProvider } from "../providers/stub-provider.js";
import { EMPTY_CONTEXT } from "../domain/context.js";
import { message } from "../domain/message.js";
import type { PreparedRequest } from "../domain/request.js";
import { asModelId, asProviderId } from "../types.js";

describe("KnowledgePipeline", () => {
  it("returns empty context without a query", async () => {
    const result = await new KnowledgePipeline().retrieve();
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value).toHaveLength(0);
  });

  it("retrieves snippets from a gateway", async () => {
    const pipeline = new KnowledgePipeline(
      new StaticKnowledgeGateway([{ source: "kb", content: "X" }]),
    );
    const result = await pipeline.retrieve("q");
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value).toHaveLength(1);
  });
});

describe("PromptPipeline", () => {
  it("prepends a system message and keeps base messages", async () => {
    const pipeline = new PromptPipeline();
    const result = await pipeline.build({
      context: { snippets: [], variables: {}, system: "SYS" },
      baseMessages: [message("user", "hi")],
    });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value).toHaveLength(2);
    expect(result.value[0]?.role).toBe("system");
    expect(result.value[1]?.content).toBe("hi");
  });

  it("errors when there are no messages", async () => {
    const result = await new PromptPipeline().build({
      context: EMPTY_CONTEXT,
      baseMessages: [],
    });
    expect(isErr(result)).toBe(true);
  });
});

describe("ExecutionPipeline", () => {
  const prepared: PreparedRequest = {
    requestId: "r",
    providerId: asProviderId("stub"),
    modelId: asModelId("m"),
    messages: [message("user", "hi")],
    params: {},
    signature: "sig",
  };

  function deps(capacity: number): ExecutionPipeline {
    return new ExecutionPipeline({
      retry: new DefaultRetryPolicy(1, 0, () => Promise.resolve()),
      breaker: new DefaultCircuitBreaker(),
      rateLimiter: new TokenBucketRateLimiter(capacity, 0, () => 0),
      health: new DefaultHealthMonitor(),
    });
  }

  it("executes through the resilience stack", async () => {
    const result = await deps(10).execute(new StubProvider(), prepared);
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.content).toBe("[stub:m] hi");
  });

  it("fails when the rate limit is exhausted", async () => {
    const result = await deps(0).execute(new StubProvider(), prepared);
    expect(isErr(result)).toBe(true);
  });
});

import { isErr } from "@telemax/core";
import { ServiceContainer } from "@telemax/core";
import { registerPromptEngine } from "@telemax/prompt-engine";
import { describe, expect, it } from "vitest";
import { AIOrchestrator, type AIOrchestratorDeps } from "./orchestrator.js";
import { StubProvider } from "./providers/stub-provider.js";
import { StaticKnowledgeGateway } from "./pipeline/knowledge-pipeline.js";
import { DEFAULT_CAPABILITIES } from "./domain/capabilities.js";
import type { ModelDescriptor } from "./domain/model.js";
import type { AIResponseChunk } from "./domain/response.js";
import { asModelId, asProviderId } from "./types.js";

function model(): ModelDescriptor {
  return {
    id: asModelId("m1"),
    providerId: asProviderId("stub"),
    displayName: "M1",
    capabilities: DEFAULT_CAPABILITIES,
    contextWindow: 8192,
    pricing: { inputPer1kTokens: 1, outputPer1kTokens: 2 },
  };
}

function withStub(deps?: AIOrchestratorDeps): AIOrchestrator {
  const orchestrator = new AIOrchestrator(deps);
  orchestrator.registerProvider(new StubProvider());
  orchestrator.registerModel(model());
  return orchestrator;
}

describe("AIOrchestrator", () => {
  it("executes a request end-to-end into a standardized response", async () => {
    const result = await withStub().execute({ input: "hello" });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.response.content).toBe("[stub:m1] hello");
    expect(result.value.response.providerId).toBe("stub");
    expect(result.value.response.modelId).toBe("m1");
    expect(result.value.response.usage.totalTokens).toBeGreaterThan(0);
    expect(result.value.response.cost).toBeGreaterThan(0);
  });

  it("serves a repeated request from cache", async () => {
    const orchestrator = withStub();
    const hits: boolean[] = [];
    orchestrator.on("response.received", (payload) => hits.push(payload.cacheHit));
    await orchestrator.execute({ input: "hi" });
    await orchestrator.execute({ input: "hi" });
    expect(hits).toEqual([false, true]);
  });

  it("fails when no provider is registered", async () => {
    expect(isErr(await new AIOrchestrator().execute({ input: "hi" }))).toBe(true);
  });

  it("retrieves context from the knowledge gateway", async () => {
    const orchestrator = withStub({
      knowledgeGateway: new StaticKnowledgeGateway([{ source: "kb", content: "FACT" }]),
    });
    const result = await orchestrator.execute({ input: "hi", knowledgeQuery: "q" });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.context.snippets).toHaveLength(1);
  });

  it("builds the prompt via the Prompt Engine when a template is given", async () => {
    const engine = registerPromptEngine(new ServiceContainer());
    await engine.registerTemplate({ id: "greet", name: "greet", body: "Hi {{name}}" });
    const orchestrator = withStub({ promptEngine: engine });
    const result = await orchestrator.execute({
      input: "ignored",
      templateId: "greet",
      variables: { name: "Ada" },
    });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.response.content).toContain("Hi Ada");
  });

  it("appends the assistant reply to the conversation", async () => {
    const orchestrator = withStub();
    const conversation = orchestrator.conversations.create({});
    await orchestrator.execute({ input: "hi", conversationId: conversation.id });
    const got = orchestrator.conversations.get(conversation.id);
    if (isErr(got)) {
      throw got.error;
    }
    const last = got.value.messages[got.value.messages.length - 1];
    expect(last?.role).toBe("assistant");
  });

  it("streams a single terminal chunk", async () => {
    const streamed = await withStub().stream({ input: "hi" });
    if (isErr(streamed)) {
      throw streamed.error;
    }
    const chunks: AIResponseChunk[] = [];
    for await (const chunk of streamed.value) {
      chunks.push(chunk);
    }
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.done).toBe(true);
    expect(chunks[0]?.delta).toContain("hi");
  });
});

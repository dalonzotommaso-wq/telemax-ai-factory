import { isErr, ServiceContainer } from "@telemax/core";
import {
  AIOrchestrator,
  StubProvider,
  DEFAULT_CAPABILITIES,
  asModelId,
  asProviderId,
} from "@telemax/ai";
import { registerPromptEngine } from "@telemax/prompt-engine";
import { WorkflowEngine } from "@telemax/workflow";
import { describe, expect, it } from "vitest";
import { GeneratorEngine } from "./engine.js";
import type { GeneratorDefinition } from "./domain/definition.js";

function templateGen(): GeneratorDefinition {
  return {
    id: "site",
    name: "Site",
    templates: [{ id: "page", name: "page", body: "<h1>{{title}}</h1>" }],
    pipeline: {
      steps: [{ id: "s1", kind: "template", templateId: "page", path: "{{title}}.html" }],
    },
  };
}

describe("GeneratorEngine", () => {
  it("registers and runs a generator producing an artifact", async () => {
    const engine = new GeneratorEngine();
    const registered = engine.registerGenerator(templateGen());
    if (isErr(registered)) {
      throw registered.error;
    }
    const result = await engine.generate("site", { title: "Home" });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.state).toBe("completed");
    expect(result.value.artifacts.get("Home.html")?.content).toBe("<h1>Home</h1>");
  });

  it("bumps the version when a generator is re-registered", () => {
    const engine = new GeneratorEngine();
    engine.registerGenerator(templateGen());
    const second = engine.registerGenerator(templateGen());
    if (isErr(second)) {
      throw second.error;
    }
    expect(second.value.version).toBe(2);
    expect(engine.getVersions("site")).toHaveLength(2);
  });

  it("round-trips generators through export/import", () => {
    const source = new GeneratorEngine();
    source.registerGenerator(templateGen());
    const bundle = source.exportBundle();
    expect(bundle.generators).toHaveLength(1);

    const target = new GeneratorEngine();
    const imported = target.importBundle(bundle);
    if (isErr(imported)) {
      throw imported.error;
    }
    expect(isErr(target.getGenerator("site"))).toBe(false);
  });

  it("serves a repeated generation from cache", async () => {
    const engine = new GeneratorEngine();
    engine.registerGenerator(templateGen());
    const first = await engine.generate("site", { title: "Home" });
    const second = await engine.generate("site", { title: "Home" });
    if (isErr(first) || isErr(second)) {
      throw new Error("generation failed");
    }
    expect(second.value.runId).toBe(first.value.runId);
  });

  it("coordinates the AI Orchestrator through an ai step", async () => {
    const engine = new GeneratorEngine();
    const orch = new AIOrchestrator();
    orch.registerProvider(new StubProvider());
    orch.registerModel({
      id: asModelId("m1"),
      providerId: asProviderId("stub"),
      displayName: "M1",
      capabilities: DEFAULT_CAPABILITIES,
      contextWindow: 8192,
      pricing: { inputPer1kTokens: 1, outputPer1kTokens: 2 },
    });
    engine.useAI(orch);
    engine.registerGenerator({
      id: "ai-gen",
      name: "AI",
      pipeline: {
        steps: [
          { id: "call", kind: "ai", input: "hi", output: "reply" },
          { id: "emit", kind: "emit", path: "reply.txt", fromVariable: "reply" },
        ],
      },
    });
    const result = await engine.generate("ai-gen");
    if (isErr(result)) {
      throw result.error;
    }
    const content = result.value.artifacts.get("reply.txt")?.content ?? "";
    expect(content.includes("hi")).toBe(true);
  });

  it("coordinates the Workflow and Prompt engines", async () => {
    const engine = new GeneratorEngine();
    const workflow = new WorkflowEngine();
    workflow.registerWorkflow({
      id: "prep",
      name: "prep",
      root: { id: "root", kind: "task", handler: "echo", input: { ready: true }, output: "state" },
    });
    engine.useWorkflow(workflow);
    const prompt = registerPromptEngine(new ServiceContainer());
    await prompt.registerTemplate({ id: "body", name: "body", body: "Body for {{title}}" });
    engine.usePrompt(prompt);

    engine.registerGenerator({
      id: "combo",
      name: "combo",
      pipeline: {
        steps: [
          { id: "wf", kind: "workflow", workflowId: "prep", output: "prep" },
          {
            id: "pr",
            kind: "prompt",
            templateId: "body",
            variables: { title: "X" },
            output: "body",
          },
          { id: "emit", kind: "emit", path: "page.html", fromVariable: "body" },
        ],
      },
    });
    const result = await engine.generate("combo");
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.state).toBe("completed");
    expect(result.value.variables["prep"]).toEqual({ state: { ready: true } });
    expect(result.value.artifacts.get("page.html")?.content).toBe("Body for X");
  });

  it("errors when generating an unknown generator", async () => {
    expect(isErr(await new GeneratorEngine().generate("ghost"))).toBe(true);
  });
});

import { isErr, ServiceContainer } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { PROMPT_ENGINE, PROMPT_REPOSITORY, registerPromptEngine } from "./di.js";
import { PromptEngine } from "./service.js";

describe("registerPromptEngine", () => {
  it("wires the engine and its collaborators into the container", () => {
    const container = new ServiceContainer();
    const engine = registerPromptEngine(container);
    expect(engine).toBeInstanceOf(PromptEngine);
    expect(container.resolve(PROMPT_ENGINE)).toBe(engine);
    expect(container.has(PROMPT_REPOSITORY)).toBe(true);
  });

  it("registers and renders end-to-end through the composed engine", async () => {
    const engine = registerPromptEngine(new ServiceContainer());
    await engine.registerTemplate({ id: "g", name: "g", body: "Hi {{name}}" });
    const rendered = await engine.render({ templateId: "g", variables: { name: "Zed" } });
    if (isErr(rendered)) {
      throw rendered.error;
    }
    expect(rendered.value.content).toBe("Hi Zed");
  });
});

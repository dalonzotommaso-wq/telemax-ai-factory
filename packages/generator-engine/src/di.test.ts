import { isErr, ServiceContainer } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { registerGeneratorEngine, GENERATOR_ENGINE, GENERATOR_TEMPLATES } from "./di.js";
import { GeneratorEngine } from "./engine.js";

describe("registerGeneratorEngine", () => {
  it("wires the engine into the container", () => {
    const container = new ServiceContainer();
    const engine = registerGeneratorEngine(container);
    expect(engine).toBeInstanceOf(GeneratorEngine);
    expect(container.resolve(GENERATOR_ENGINE)).toBe(engine);
    expect(container.has(GENERATOR_TEMPLATES)).toBe(true);
  });

  it("generates through the wired engine", async () => {
    const engine = registerGeneratorEngine(new ServiceContainer());
    engine.registerGenerator({
      id: "g",
      name: "g",
      pipeline: { steps: [{ id: "e", kind: "emit", path: "out.txt", content: "hello {{who}}" }] },
    });
    const result = await engine.generate("g", { who: "world" });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.artifacts.get("out.txt")?.content).toBe("hello world");
  });
});

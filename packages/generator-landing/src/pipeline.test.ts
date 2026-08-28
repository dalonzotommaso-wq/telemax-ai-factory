import { describe, expect, it } from "vitest";
import { resolveLandingPageConfig } from "./config.js";
import { buildPipeline } from "./pipeline.js";
import { buildLandingPageDefinition } from "./generator.js";
import { allTemplates } from "./templates/index.js";

const cfg = resolveLandingPageConfig({ siteName: "Acme" });

describe("buildPipeline", () => {
  it("produces steps with unique ids", () => {
    const steps = buildPipeline(cfg);
    const ids = steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("orders integration steps before template and emit steps", () => {
    const kinds = buildPipeline(cfg).map((s) => s.kind);
    const firstTemplate = kinds.indexOf("template");
    const lastIntegration = Math.max(
      kinds.lastIndexOf("workflow"),
      kinds.lastIndexOf("prompt"),
      kinds.lastIndexOf("ai"),
    );
    expect(lastIntegration).toBeLessThan(firstTemplate);
    expect(kinds.indexOf("emit")).toBeGreaterThan(firstTemplate);
  });

  it("has one template step per template, emitting flat paths", () => {
    const steps = buildPipeline(cfg).filter((s) => s.kind === "template");
    expect(steps).toHaveLength(allTemplates().length);
    for (const step of steps) {
      if (step.kind === "template") expect(step.path).not.toContain("{{");
    }
  });

  it("wires the AI content-plan prompt into the ai step input", () => {
    const steps = buildPipeline(cfg, "INSTRUCTION");
    const ai = steps.find((s) => s.kind === "ai");
    expect(ai?.kind === "ai" ? ai.input : "").toBe("INSTRUCTION");
  });
});

describe("buildLandingPageDefinition", () => {
  it("is a landing-page target with templates and a pipeline", () => {
    const def = buildLandingPageDefinition(cfg);
    expect(def.id).toBe("landing-page");
    expect(def.target).toBe("landing-page");
    expect(def.templates?.length).toBe(allTemplates().length);
    expect(def.pipeline.steps.length).toBeGreaterThan(0);
  });
});

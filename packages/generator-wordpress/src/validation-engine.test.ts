import { isErr } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { validateProject } from "./validation-engine.js";

describe("validateProject", () => {
  it("passes for a valid site and reports artifacts", () => {
    const result = validateProject({ siteName: "Daily Post" });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.artifactCount).toBeGreaterThan(30);
    expect(result.value.componentCount).toBe(13);
    expect(result.value.contrastPasses).toBe(true);
  });

  it("fails for an invalid config", () => {
    expect(isErr(validateProject({ siteName: "" }))).toBe(true);
  });
});

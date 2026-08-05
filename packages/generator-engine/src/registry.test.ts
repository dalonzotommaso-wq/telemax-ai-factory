import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { GeneratorFactory } from "./factory.js";
import { GeneratorRegistry } from "./registry.js";
import { asGeneratorId } from "./types.js";

function compiled(id: string) {
  const result = new GeneratorFactory().create({
    id,
    name: id,
    pipeline: { steps: [{ id: "t", kind: "emit", path: "a.txt", content: "x" }] },
  });
  if (isErr(result)) {
    throw result.error;
  }
  return result.value;
}

describe("GeneratorRegistry", () => {
  it("saves, resolves and lists generators with version history", () => {
    const registry = new GeneratorRegistry();
    registry.save(compiled("gen"));
    expect(registry.has(asGeneratorId("gen"))).toBe(true);
    expect(isOk(registry.get(asGeneratorId("gen")))).toBe(true);
    expect(registry.list()).toHaveLength(1);
    expect(registry.versions(asGeneratorId("gen"))).toHaveLength(1);
  });

  it("fails to resolve an unknown generator", () => {
    expect(isErr(new GeneratorRegistry().get(asGeneratorId("ghost")))).toBe(true);
  });
});

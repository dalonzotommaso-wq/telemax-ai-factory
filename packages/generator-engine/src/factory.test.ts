import { isErr } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { GeneratorFactory } from "./factory.js";
import type { GeneratorDefinition } from "./domain/definition.js";

const factory = new GeneratorFactory();

const good: GeneratorDefinition = {
  id: "gen",
  name: "Gen",
  target: "api",
  pipeline: { steps: [{ id: "t", kind: "template", templateId: "tpl", path: "out.txt" }] },
};

describe("GeneratorFactory", () => {
  it("compiles a valid definition with target, checksum and signature", () => {
    const result = factory.create(good);
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.id).toBe("gen");
    expect(result.value.version).toBe(1);
    expect(result.value.target).toBe("api");
    expect(result.value.signature.length).toBeGreaterThan(0);
    expect(result.value.checksum.length).toBeGreaterThan(0);
  });

  it("defaults the target to 'generic'", () => {
    const { target: _omitted, ...withoutTarget } = good;
    const result = factory.create(withoutTarget);
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.target).toBe("generic");
  });

  it("fails to compile an invalid definition", () => {
    expect(isErr(factory.create({ id: "", name: "", pipeline: { steps: [] } }))).toBe(true);
  });
});

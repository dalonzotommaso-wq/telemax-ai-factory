import { isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { GeneratorTransformRegistry } from "./registry.js";
import { registerBuiltinTransforms } from "./builtin.js";
import { createContext } from "../domain/context.js";
import { asGeneratorId } from "../types.js";

const ctx = createContext(asGeneratorId("g"), "r", "generic");

describe("transforms", () => {
  it("registers builtins and runs them", async () => {
    const registry = new GeneratorTransformRegistry();
    registerBuiltinTransforms(registry);
    expect(registry.has("identity")).toBe(true);
    expect(registry.list()).toContain("json");

    const identity = registry.get("identity");
    const idResult = await identity?.({ a: 1 }, ctx);
    expect(idResult !== undefined && isOk(idResult)).toBe(true);

    const json = registry.get("json");
    const jsonResult = await json?.({ a: 1 }, ctx);
    if (jsonResult === undefined || !isOk(jsonResult)) {
      throw new Error("json transform failed");
    }
    expect(jsonResult.value).toBe('{"a":1}');
  });
});

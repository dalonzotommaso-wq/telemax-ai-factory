import { isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { StepHandlerRegistry } from "./registry.js";
import { registerBuiltinHandlers } from "./builtin.js";
import { createContext } from "../domain/context.js";
import { asWorkflowId } from "../types.js";

describe("StepHandlerRegistry + builtins", () => {
  it("registers and resolves handlers", async () => {
    const registry = new StepHandlerRegistry();
    registerBuiltinHandlers(registry);
    expect(registry.has("noop")).toBe(true);
    expect(registry.has("echo")).toBe(true);
    expect(registry.list()).toContain("echo");

    const ctx = createContext(asWorkflowId("w"), "r");
    const echo = registry.get("echo");
    const result = await echo?.({ a: 1 }, ctx);
    expect(result !== undefined && isOk(result)).toBe(true);
  });
});

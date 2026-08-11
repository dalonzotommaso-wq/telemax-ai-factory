import { err, isErr } from "@telemax/core";
import type { AIOrchestrator } from "@telemax/ai";
import { describe, expect, it } from "vitest";
import { isFallback, resilientAiRunner, sanitizeMeta } from "./ai-meta.js";

describe("resilientAiRunner", () => {
  it("degrades an Orchestrator error to an empty (fallback) string", async () => {
    const failing = {
      execute: () => Promise.resolve(err(new Error("boom"))),
    } as unknown as AIOrchestrator;

    const result = await resilientAiRunner(failing).run({ input: "x" });
    if (isErr(result)) throw new Error("expected ok, got error");
    expect(result.value).toBe("");
  });
});

describe("meta helpers", () => {
  it("sanitizeMeta collapses whitespace, strips quotes and caps length", () => {
    expect(sanitizeMeta('  "Hello   world"  ')).toBe("Hello world");
    expect(sanitizeMeta("a".repeat(200)).length).toBeLessThanOrEqual(160);
  });

  it("isFallback flags empty and stub-echo output", () => {
    expect(isFallback("")).toBe(true);
    expect(isFallback("   ")).toBe(true);
    expect(isFallback("[stub:stub-model] write a plan")).toBe(true);
    expect(isFallback('{"siteTitle":"x"}')).toBe(false);
  });
});

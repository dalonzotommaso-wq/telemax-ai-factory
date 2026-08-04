import { describe, expect, it } from "vitest";
import { ContextBuilder } from "./context-builder.js";

describe("ContextBuilder", () => {
  it("derives a system preamble from snippets", () => {
    const context = new ContextBuilder().build({
      snippets: [
        { source: "kb", content: "Fact A" },
        { source: "kb", content: "Fact B" },
      ],
    });
    expect(context.system).toContain("Context:");
    expect(context.system).toContain("- Fact A");
    expect(context.snippets).toHaveLength(2);
  });

  it("uses an explicit system and defaults to none", () => {
    expect(new ContextBuilder().build({ system: "S" }).system).toBe("S");
    expect(new ContextBuilder().build({}).system).toBeUndefined();
  });
});

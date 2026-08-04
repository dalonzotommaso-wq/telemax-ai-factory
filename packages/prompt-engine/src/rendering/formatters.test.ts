import { isErr } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { DefaultPromptFormatter } from "./formatters.js";
import type { RenderedPrompt } from "../domain/message.js";

const formatter = new DefaultPromptFormatter();
const prompt: RenderedPrompt = {
  messages: [
    { role: "system", content: "S" },
    { role: "user", content: "U" },
  ],
};

describe("DefaultPromptFormatter", () => {
  it("formats as text", () => {
    const result = formatter.format(prompt, "text");
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value).toBe("[system]\nS\n\n[user]\nU");
  });

  it("formats as markdown", () => {
    const result = formatter.format(prompt, "markdown");
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value).toBe("## System\n\nS\n\n## User\n\nU");
  });

  it("reports xml and json as not implemented (prepared)", () => {
    expect(isErr(formatter.format(prompt, "xml"))).toBe(true);
    expect(isErr(formatter.format(prompt, "json"))).toBe(true);
  });
});

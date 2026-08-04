import { describe, expect, it } from "vitest";
import { createPromptMetadata } from "./metadata.js";

describe("createPromptMetadata", () => {
  it("normalizes categories and tags and defaults the language", () => {
    const meta = createPromptMetadata(
      { categories: ["Sales Copy", "sales copy"], tags: ["Hero"] },
      "2026-01-01T00:00:00.000Z",
      "en",
    );
    expect(meta.language).toBe("en");
    expect(meta.categories).toEqual(["sales-copy"]);
    expect(meta.tags).toEqual(["hero"]);
    expect(meta.title).toBeUndefined();
  });

  it("keeps provided optional fields and language", () => {
    const meta = createPromptMetadata(
      { title: "T", author: "A", language: "it" },
      "2026-01-01T00:00:00.000Z",
      "en",
    );
    expect(meta.title).toBe("T");
    expect(meta.author).toBe("A");
    expect(meta.language).toBe("it");
  });
});

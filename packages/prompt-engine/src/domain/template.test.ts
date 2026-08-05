import { describe, expect, it } from "vitest";
import { PromptTemplate } from "./template.js";
import { createPromptMetadata } from "./metadata.js";
import { asTemplateId } from "../types.js";

const meta = createPromptMetadata({}, "2026-01-01T00:00:00.000Z", "en");

function make(body: string, locales?: Record<string, string>): PromptTemplate {
  return PromptTemplate.create({
    id: asTemplateId("t"),
    name: "t",
    body,
    format: "text",
    variables: [],
    metadata: meta,
    ...(locales !== undefined ? { locales } : {}),
  });
}

describe("PromptTemplate", () => {
  it("computes checksum and signature and defaults version to 1", () => {
    const template = make("Hello");
    expect(template.version).toBe(1);
    expect(template.checksum.length).toBeGreaterThan(0);
    expect(template.signature.length).toBeGreaterThan(0);
  });

  it("produces a stable signature that changes with the body", () => {
    expect(make("Hello").signature).toBe(make("Hello").signature);
    expect(make("Hello").signature).not.toBe(make("World").signature);
  });

  it("resolves localized bodies with fallback", () => {
    const template = make("Hi", { it: "Ciao" });
    expect(template.bodyFor("it")).toBe("Ciao");
    expect(template.bodyFor("fr")).toBe("Hi");
  });

  it("bumps the version via withVersion", () => {
    const next = make("Hello").withVersion(2, meta);
    expect(next.version).toBe(2);
    expect(next.id).toBe("t");
  });
});

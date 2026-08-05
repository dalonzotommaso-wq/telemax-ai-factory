import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { PromptValidator } from "./validator.js";
import { PromptTemplate } from "./domain/template.js";
import { createPromptMetadata } from "./domain/metadata.js";
import { asTemplateId } from "./types.js";
import type { VariableSchema } from "./domain/variable.js";

const meta = createPromptMetadata({}, "2026-01-01T00:00:00.000Z", "en");
const validator = new PromptValidator();

function make(id: string, variables: VariableSchema, extendsId?: string): PromptTemplate {
  return PromptTemplate.create({
    id: asTemplateId(id),
    name: id,
    body: "b",
    format: "text",
    variables,
    metadata: meta,
    ...(extendsId !== undefined ? { extendsId: asTemplateId(extendsId) } : {}),
  });
}

describe("PromptValidator", () => {
  it("rejects invalid variable names", () => {
    expect(
      isErr(validator.validate(make("t", [{ name: "1bad", type: "string", required: true }]))),
    ).toBe(true);
  });

  it("requires enumValues for enum variables", () => {
    expect(
      isErr(validator.validate(make("t", [{ name: "c", type: "enum", required: true }]))),
    ).toBe(true);
  });

  it("rejects self-inheritance", () => {
    expect(isErr(validator.validate(make("t", [], "t")))).toBe(true);
  });

  it("accepts a valid template", () => {
    expect(
      isOk(validator.validate(make("t", [{ name: "name", type: "string", required: true }]))),
    ).toBe(true);
  });
});

import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { DefaultSchemaValidator } from "./schema-validator.js";
import type { VariableSchema } from "../domain/variable.js";

const validator = new DefaultSchemaValidator();

describe("DefaultSchemaValidator", () => {
  it("fails on a missing required variable", () => {
    const schema: VariableSchema = [{ name: "a", type: "string", required: true }];
    expect(isErr(validator.validate(schema, {}))).toBe(true);
  });

  it("fails on a type mismatch", () => {
    const schema: VariableSchema = [{ name: "a", type: "number", required: true }];
    expect(isErr(validator.validate(schema, { a: "x" }))).toBe(true);
  });

  it("fills declared defaults", () => {
    const schema: VariableSchema = [{ name: "b", type: "number", required: false, default: 5 }];
    const result = validator.validate(schema, {});
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value["b"]).toBe(5);
  });

  it("enforces enum values", () => {
    const schema: VariableSchema = [
      { name: "c", type: "enum", required: true, enumValues: ["x", "y"] },
    ];
    expect(isErr(validator.validate(schema, { c: "z" }))).toBe(true);
    expect(isOk(validator.validate(schema, { c: "x" }))).toBe(true);
  });
});

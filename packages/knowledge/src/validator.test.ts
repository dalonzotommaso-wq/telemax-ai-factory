import { describe, expect, it } from "vitest";
import { isErr, isOk } from "@telemax/core";
import { KnowledgeValidator } from "./validator.js";
import { KnowledgeValidationError } from "./errors.js";
import { Document } from "./domain/document.js";
import { createMetadata } from "./domain/metadata.js";
import { asDocumentId } from "./types.js";

const now = "2026-07-27T00:00:00.000Z";

describe("KnowledgeValidator", () => {
  it("accepts a well-formed document", () => {
    const validator = new KnowledgeValidator();
    const doc = Document.create({
      id: asDocumentId("ok"),
      format: "markdown",
      content: "content",
      metadata: createMetadata({ categories: ["news"], tags: ["serie-d"] }, now, "en"),
    });
    expect(isOk(validator.validate(doc))).toBe(true);
  });

  it("rejects content larger than the configured maximum", () => {
    const validator = new KnowledgeValidator({ maxContentBytes: 4 });
    const doc = Document.create({
      id: asDocumentId("big"),
      format: "markdown",
      content: "way too long",
      metadata: createMetadata({}, now, "en"),
    });
    const result = validator.validate(doc);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toBeInstanceOf(KnowledgeValidationError);
    }
  });
});

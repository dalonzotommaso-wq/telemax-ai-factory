import { describe, expect, it } from "vitest";
import { Document } from "./document.js";
import { createMetadata } from "./metadata.js";
import { asDocumentId } from "../types.js";

const now = "2026-07-27T00:00:00.000Z";

describe("Document", () => {
  it("creates with a checksum and defaults version to 1", () => {
    const doc = Document.create({
      id: asDocumentId("intro"),
      format: "markdown",
      content: "hello world",
      metadata: createMetadata({}, now, "en"),
    });
    expect(doc.version).toBe(1);
    expect(doc.checksum).toHaveLength(64);
    expect(doc.parsed).toBeUndefined();
  });

  it("returns new immutable copies via withVersion/withMetadata", () => {
    const doc = Document.create({
      id: asDocumentId("intro"),
      format: "markdown",
      content: "abc",
      metadata: createMetadata({ title: "A" }, now, "en"),
    });
    const bumped = doc.withVersion(3);
    expect(bumped.version).toBe(3);
    expect(doc.version).toBe(1);
    expect(bumped).not.toBe(doc);

    const retitled = doc.withMetadata(createMetadata({ title: "B" }, now, "en"));
    expect(retitled.metadata.title).toBe("B");
    expect(doc.metadata.title).toBe("A");
  });
});

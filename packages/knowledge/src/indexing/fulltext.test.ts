import { describe, expect, it } from "vitest";
import { isErr } from "@telemax/core";
import { InMemoryFullTextIndex } from "./in-memory-fulltext-index.js";
import { Document } from "../domain/document.js";
import { createMetadata } from "../domain/metadata.js";
import { asDocumentId } from "../types.js";

const now = "2026-07-27T00:00:00.000Z";

function doc(id: string, title: string, content: string, tags: readonly string[] = []): Document {
  return Document.create({
    id: asDocumentId(id),
    format: "markdown",
    content,
    metadata: createMetadata({ title, tags }, now, "en"),
  });
}

describe("InMemoryFullTextIndex", () => {
  it("indexes and ranks by term frequency", async () => {
    const index = new InMemoryFullTextIndex();
    await index.add(doc("a", "Broadcast", "television broadcast television"));
    await index.add(doc("b", "Radio", "radio waves"));
    const result = await index.search({ text: "television" });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value[0]?.documentId).toBe("a");
    expect(result.value).toHaveLength(1);
  });

  it("applies tag filters and honors limit", async () => {
    const index = new InMemoryFullTextIndex();
    await index.add(doc("a", "One", "shared term", ["news"]));
    await index.add(doc("b", "Two", "shared term", ["guide"]));
    const filtered = await index.search({ text: "shared", tags: ["news"] });
    if (isErr(filtered)) {
      throw filtered.error;
    }
    expect(filtered.value).toHaveLength(1);
    expect(filtered.value[0]?.documentId).toBe("a");
  });

  it("removes documents from the index", async () => {
    const index = new InMemoryFullTextIndex();
    await index.add(doc("a", "One", "unique token"));
    await index.remove(asDocumentId("a"));
    const result = await index.search({ text: "unique" });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value).toHaveLength(0);
  });
});

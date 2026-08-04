import { describe, expect, it } from "vitest";
import { isErr, isOk } from "@telemax/core";
import { InMemoryKnowledgeRepository } from "./in-memory-repository.js";
import { Document } from "../domain/document.js";
import { createMetadata } from "../domain/metadata.js";
import { asDocumentId } from "../types.js";

const now = "2026-07-27T00:00:00.000Z";

function doc(id: string, content: string, categories: readonly string[] = []): Document {
  return Document.create({
    id: asDocumentId(id),
    format: "markdown",
    content,
    metadata: createMetadata({ categories }, now, "en"),
  });
}

describe("InMemoryKnowledgeRepository", () => {
  it("saves, gets and reports presence", async () => {
    const repo = new InMemoryKnowledgeRepository();
    await repo.save(doc("a", "alpha"));
    expect(await repo.has(asDocumentId("a"))).toBe(true);
    const got = await repo.get(asDocumentId("a"));
    if (isErr(got)) {
      throw got.error;
    }
    expect(got.value.content).toBe("alpha");
  });

  it("returns not-found errors for missing documents", async () => {
    const repo = new InMemoryKnowledgeRepository();
    expect(isErr(await repo.get(asDocumentId("missing")))).toBe(true);
    expect(isErr(await repo.remove(asDocumentId("missing")))).toBe(true);
  });

  it("records version history when enabled", async () => {
    const repo = new InMemoryKnowledgeRepository({
      enableVersioning: true,
      clock: { now: () => new Date(now) },
    });
    await repo.save(doc("a", "v1"));
    await repo.save(doc("a", "v2"));
    const versions = await repo.versions(asDocumentId("a"));
    if (isErr(versions)) {
      throw versions.error;
    }
    expect(versions.value).toHaveLength(2);
  });

  it("filters by category on list", async () => {
    const repo = new InMemoryKnowledgeRepository();
    await repo.save(doc("a", "x", ["news"]));
    await repo.save(doc("b", "y", ["guide"]));
    const listed = await repo.list({ categories: ["news"] });
    if (isErr(listed)) {
      throw listed.error;
    }
    expect(listed.value).toHaveLength(1);
    expect(listed.value[0]?.id).toBe("a");
    expect(isOk(listed)).toBe(true);
  });
});

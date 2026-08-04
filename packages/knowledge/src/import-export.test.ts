import { describe, expect, it } from "vitest";
import { isErr, isOk } from "@telemax/core";
import { ExportManager, type KnowledgeBundle } from "./export-manager.js";
import { ImportManager } from "./import-manager.js";
import { InMemoryKnowledgeRepository } from "./repository/in-memory-repository.js";
import { KnowledgeValidator } from "./validator.js";
import { KnowledgeEventBus } from "./events.js";
import { Document } from "./domain/document.js";
import { createMetadata } from "./domain/metadata.js";
import { asDocumentId } from "./types.js";

const now = "2026-07-27T00:00:00.000Z";

describe("Export/Import", () => {
  it("round-trips documents through a bundle", async () => {
    const source = new InMemoryKnowledgeRepository();
    await source.save(
      Document.create({
        id: asDocumentId("a"),
        format: "markdown",
        content: "alpha",
        metadata: createMetadata({ title: "A", tags: ["news"] }, now, "en"),
      }),
    );
    const exported = await new ExportManager(source).export();
    if (isErr(exported)) {
      throw exported.error;
    }
    expect(exported.value.documents).toHaveLength(1);

    const target = new InMemoryKnowledgeRepository();
    const importer = new ImportManager(target, new KnowledgeValidator(), new KnowledgeEventBus());
    const imported = await importer.import(exported.value);
    if (isErr(imported)) {
      throw imported.error;
    }
    const got = await target.get(asDocumentId("a"));
    if (isErr(got)) {
      throw got.error;
    }
    expect(got.value.metadata.title).toBe("A");
    expect(isOk(imported)).toBe(true);
  });

  it("rejects an unsupported bundle version", async () => {
    const target = new InMemoryKnowledgeRepository();
    const importer = new ImportManager(target, new KnowledgeValidator(), new KnowledgeEventBus());
    const bogus = { version: 2, exportedAt: now, documents: [] } as unknown as KnowledgeBundle;
    expect(isErr(await importer.import(bogus))).toBe(true);
  });
});

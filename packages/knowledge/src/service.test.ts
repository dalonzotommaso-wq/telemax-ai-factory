import { describe, expect, it } from "vitest";
import { isErr, isOk } from "@telemax/core";
import { KnowledgeService } from "./service.js";
import { KnowledgeRegistry } from "./registry.js";
import { KnowledgeValidator } from "./validator.js";
import { KnowledgeEventBus } from "./events.js";
import { InMemoryKnowledgeRepository } from "./repository/in-memory-repository.js";
import { InMemoryFullTextIndex } from "./indexing/in-memory-fulltext-index.js";
import { MarkdownLoader } from "./loaders/markdown-loader.js";
import type { Document } from "./domain/document.js";

function buildService(): { service: KnowledgeService; events: KnowledgeEventBus } {
  const events = new KnowledgeEventBus();
  const registry = new KnowledgeRegistry();
  registry.registerLoader(new MarkdownLoader({ defaultLanguage: "en" }));
  const service = new KnowledgeService({
    repository: new InMemoryKnowledgeRepository(),
    registry,
    validator: new KnowledgeValidator(),
    events,
    index: new InMemoryFullTextIndex(),
  });
  return { service, events };
}

describe("KnowledgeService", () => {
  it("adds a document, emitting document.registered with version 1", async () => {
    const { service, events } = buildService();
    const registered: Document[] = [];
    events.on("document.registered", (payload) => registered.push(payload.document));

    const result = await service.addDocument({
      id: "intro",
      format: "markdown",
      content: "welcome to telemax",
      metadata: { title: "Intro", categories: ["news"] },
    });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.version).toBe(1);
    expect(registered).toHaveLength(1);
  });

  it("bumps version and preserves createdAt on update", async () => {
    const { service, events } = buildService();
    let previous = -1;
    events.on("document.updated", (payload) => {
      previous = payload.previousVersion;
    });

    const first = await service.addDocument({ id: "d", format: "markdown", content: "one" });
    const second = await service.addDocument({ id: "d", format: "markdown", content: "two" });
    if (isErr(first) || isErr(second)) {
      throw new Error("expected both writes to succeed");
    }
    expect(second.value.version).toBe(2);
    expect(previous).toBe(1);
    expect(second.value.metadata.createdAt).toBe(first.value.metadata.createdAt);

    const versions = await service.getVersions("d");
    if (isErr(versions)) {
      throw versions.error;
    }
    expect(versions.value).toHaveLength(2);
  });

  it("ingests raw markdown and makes it searchable", async () => {
    const { service } = buildService();
    const ingested = await service.ingest({
      ref: "guides/setup.md",
      format: "markdown",
      content: "---\ntitle: Setup\ntags: [guide]\n---\nInstall the broadcast tool.\n",
    });
    if (isErr(ingested)) {
      throw ingested.error;
    }
    const hits = await service.search({ text: "broadcast" });
    if (isErr(hits)) {
      throw hits.error;
    }
    expect(hits.value).toHaveLength(1);
    expect(hits.value[0]?.documentId).toBe(ingested.value.id);
  });

  it("removes a document and de-indexes it", async () => {
    const { service, events } = buildService();
    const removedIds: string[] = [];
    events.on("document.removed", (payload) => removedIds.push(payload.documentId));

    await service.addDocument({ id: "r", format: "markdown", content: "unique-token here" });
    const removed = await service.removeDocument("r");
    expect(isOk(removed)).toBe(true);
    expect(removedIds).toEqual(["r"]);

    const hits = await service.search({ text: "unique-token" });
    if (isErr(hits)) {
      throw hits.error;
    }
    expect(hits.value).toHaveLength(0);
  });

  it("returns a not-implemented error when searching without an index", async () => {
    const registry = new KnowledgeRegistry();
    const service = new KnowledgeService({
      repository: new InMemoryKnowledgeRepository(),
      registry,
      validator: new KnowledgeValidator(),
    });
    expect(isErr(await service.search({ text: "x" }))).toBe(true);
  });
});

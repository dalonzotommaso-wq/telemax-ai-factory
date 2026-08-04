import { describe, expect, it } from "vitest";
import { ServiceContainer, isErr } from "@telemax/core";
import { KNOWLEDGE_REPOSITORY, KNOWLEDGE_SERVICE, registerKnowledge } from "./di.js";
import { KnowledgeService } from "./service.js";

describe("registerKnowledge", () => {
  it("wires the default engine into a container and returns the service", async () => {
    const container = new ServiceContainer();
    const service = registerKnowledge(container);
    expect(service).toBeInstanceOf(KnowledgeService);
    expect(container.resolve(KNOWLEDGE_SERVICE)).toBe(service);
    expect(container.has(KNOWLEDGE_REPOSITORY)).toBe(true);

    const added = await service.ingest({
      ref: "readme.md",
      format: "markdown",
      content: "---\ntitle: Readme\n---\nHello broadcast world.\n",
    });
    if (isErr(added)) {
      throw added.error;
    }
    const hits = await service.search({ text: "broadcast" });
    if (isErr(hits)) {
      throw hits.error;
    }
    expect(hits.value).toHaveLength(1);
  });
});

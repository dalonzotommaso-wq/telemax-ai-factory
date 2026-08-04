import { describe, expect, it } from "vitest";
import { KnowledgeEventBus } from "./events.js";
import { asDocumentId } from "./types.js";

describe("KnowledgeEventBus", () => {
  it("emits to subscribers and supports unsubscribe", () => {
    const bus = new KnowledgeEventBus();
    const seen: string[] = [];
    const off = bus.on("document.removed", (payload) => {
      seen.push(payload.documentId);
    });
    bus.emit("document.removed", { documentId: asDocumentId("a") });
    off();
    bus.emit("document.removed", { documentId: asDocumentId("b") });
    expect(seen).toEqual(["a"]);
  });
});

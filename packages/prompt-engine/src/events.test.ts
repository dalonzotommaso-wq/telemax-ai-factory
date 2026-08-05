import { describe, expect, it, vi } from "vitest";
import { PromptEventBus } from "./events.js";
import { asTemplateId } from "./types.js";

describe("PromptEventBus", () => {
  it("delivers events to subscribers and supports unsubscribe", () => {
    const bus = new PromptEventBus();
    const handler = vi.fn();
    const unsubscribe = bus.on("template.registered", handler);
    bus.emit("template.registered", { templateId: asTemplateId("t"), version: 1 });
    expect(handler).toHaveBeenCalledTimes(1);
    unsubscribe();
    bus.emit("template.registered", { templateId: asTemplateId("t"), version: 2 });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

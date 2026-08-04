import { describe, expect, it, vi } from "vitest";
import { GeneratorEventBus } from "./events.js";
import { asGeneratorId } from "./types.js";

describe("GeneratorEventBus", () => {
  it("delivers events and supports unsubscribe", () => {
    const bus = new GeneratorEventBus();
    const handler = vi.fn();
    const off = bus.on("generation.started", handler);
    bus.emit("generation.started", { generatorId: asGeneratorId("g"), runId: "r1" });
    expect(handler).toHaveBeenCalledTimes(1);
    off();
    bus.emit("generation.started", { generatorId: asGeneratorId("g"), runId: "r2" });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

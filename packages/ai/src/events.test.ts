import { describe, expect, it, vi } from "vitest";
import { AIEventBus } from "./events.js";

describe("AIEventBus", () => {
  it("delivers events and supports unsubscribe", () => {
    const bus = new AIEventBus();
    const handler = vi.fn();
    const unsubscribe = bus.on("request.received", handler);
    bus.emit("request.received", { requestId: "r1" });
    expect(handler).toHaveBeenCalledTimes(1);
    unsubscribe();
    bus.emit("request.received", { requestId: "r2" });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

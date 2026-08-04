import { describe, expect, it } from "vitest";
import { MetricsCollector } from "./telemetry.js";

describe("MetricsCollector", () => {
  it("records counters and observations", () => {
    const metrics = new MetricsCollector();
    metrics.increment("a");
    metrics.increment("a", 2);
    metrics.observe("lat", 10);
    metrics.observe("lat", 20);
    expect(metrics.counter("a")).toBe(3);
    expect(metrics.samples("lat")).toEqual([10, 20]);
  });
});

import { describe, expect, it } from "vitest";
import { MetricsCollector } from "./metrics.js";

describe("MetricsCollector", () => {
  it("records counters and observations", () => {
    const metrics = new MetricsCollector();
    metrics.increment("a");
    metrics.increment("a", 2);
    metrics.observe("d", 7);
    expect(metrics.counter("a")).toBe(3);
    expect(metrics.samples("d")).toEqual([7]);
  });
});

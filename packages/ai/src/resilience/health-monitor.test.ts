import { describe, expect, it } from "vitest";
import { DefaultHealthMonitor } from "./health-monitor.js";
import { asProviderId } from "../types.js";

describe("DefaultHealthMonitor", () => {
  it("tracks health transitions", () => {
    const monitor = new DefaultHealthMonitor(3);
    const id = asProviderId("p");
    expect(monitor.state(id)).toBe("healthy");
    monitor.report(id, false);
    expect(monitor.state(id)).toBe("degraded");
    monitor.report(id, false);
    monitor.report(id, false);
    expect(monitor.state(id)).toBe("unavailable");
    monitor.report(id, true);
    expect(monitor.state(id)).toBe("healthy");
  });
});

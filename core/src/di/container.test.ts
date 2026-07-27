import { describe, expect, it } from "vitest";
import { ContainerError } from "../errors/errors.js";
import { createToken, ServiceContainer } from "./container.js";

interface Clock {
  now(): number;
}

const CLOCK = createToken<Clock>("Clock");

describe("ServiceContainer", () => {
  it("resolves lazily and memoizes the instance", () => {
    const container = new ServiceContainer();
    let builds = 0;
    container.register(CLOCK, () => {
      builds += 1;
      return { now: () => 123 };
    });

    expect(builds).toBe(0);
    const first = container.resolve(CLOCK);
    const second = container.resolve(CLOCK);

    expect(first).toBe(second);
    expect(builds).toBe(1);
    expect(first.now()).toBe(123);
  });

  it("throws a ContainerError for an unregistered token", () => {
    const container = new ServiceContainer();
    expect(() => container.resolve(CLOCK)).toThrow(ContainerError);
  });
});

import { describe, expect, it } from "vitest";
import { DefaultCostCalculator, CostTracker } from "./cost-tracker.js";
import { HeuristicTokenCounter } from "./token-counter.js";
import { message } from "../domain/message.js";
import { asModelId, asProviderId } from "../types.js";

describe("cost", () => {
  it("computes cost from usage and pricing", () => {
    const cost = new DefaultCostCalculator().cost(
      { promptTokens: 1000, completionTokens: 1000, totalTokens: 2000 },
      { inputPer1kTokens: 1, outputPer1kTokens: 2 },
    );
    expect(cost).toBe(3);
  });

  it("accumulates spend per provider", () => {
    const tracker = new CostTracker();
    const p = asProviderId("stub");
    tracker.track(p, asModelId("m1"), 1.5);
    tracker.track(p, asModelId("m1"), 0.5);
    expect(tracker.total()).toBe(2);
    expect(tracker.byProvider(p)).toBe(2);
  });
});

describe("HeuristicTokenCounter", () => {
  it("estimates tokens for text and messages", () => {
    const counter = new HeuristicTokenCounter();
    expect(counter.count("")).toBe(0);
    expect(counter.count("abcd")).toBe(1);
    expect(counter.countMessages([message("user", "abcd")])).toBe(3);
  });
});

import { isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { StubProvider } from "./stub-provider.js";
import { message } from "../domain/message.js";
import type { PreparedRequest } from "../domain/request.js";
import { asModelId, asProviderId } from "../types.js";

function prepared(): PreparedRequest {
  return {
    requestId: "r1",
    providerId: asProviderId("stub"),
    modelId: asModelId("m1"),
    messages: [message("user", "hello")],
    params: {},
    signature: "sig",
  };
}

describe("StubProvider", () => {
  it("returns a deterministic reply with usage and zero cost", async () => {
    const result = await new StubProvider().complete(prepared());
    if (!isOk(result)) {
      throw result.error;
    }
    expect(result.value.content).toBe("[stub:m1] hello");
    expect(result.value.finishReason).toBe("stop");
    expect(result.value.usage.totalTokens).toBeGreaterThan(0);
    expect(result.value.cost).toBe(0);
  });

  it("streams a single terminal chunk", async () => {
    const chunks = [];
    for await (const chunk of new StubProvider().stream(prepared())) {
      chunks.push(chunk);
    }
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.done).toBe(true);
    expect(chunks[0]?.delta).toContain("hello");
  });
});

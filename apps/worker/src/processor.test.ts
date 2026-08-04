import { describe, expect, it } from "vitest";
import { processGenerationJob } from "./processor.js";

describe("processGenerationJob", () => {
  it("accepts a valid job", () => {
    const r = processGenerationJob({ generator: "wordpress-news", siteName: "TGMAX" });
    expect(r.status).toBe("accepted");
    expect(r.generator).toBe("wordpress-news");
    expect(typeof r.receivedAt).toBe("string");
  });

  it("rejects an invalid job", () => {
    expect(() => processGenerationJob({ generator: "", siteName: "" })).toThrow();
  });
});

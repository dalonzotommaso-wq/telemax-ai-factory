import { describe, expect, it } from "vitest";
import { createMetadata, touchMetadata } from "./metadata.js";

const now = "2026-07-27T00:00:00.000Z";

describe("metadata", () => {
  it("applies defaults and normalizes categories/tags into slugs", () => {
    const meta = createMetadata(
      { categories: ["News Portal", "News Portal"], tags: ["Serie D"] },
      now,
      "it",
    );
    expect(meta.language).toBe("it");
    expect(meta.categories).toEqual(["news-portal"]);
    expect(meta.tags).toEqual(["serie-d"]);
    expect(meta.createdAt).toBe(now);
    expect(meta.custom).toEqual({});
  });

  it("omits optional fields that were not provided", () => {
    const meta = createMetadata({}, now, "en");
    expect("title" in meta).toBe(false);
    expect("author" in meta).toBe(false);
  });

  it("touchMetadata refreshes updatedAt only", () => {
    const meta = createMetadata({ title: "X" }, now, "en");
    const later = "2026-07-28T00:00:00.000Z";
    const touched = touchMetadata(meta, later);
    expect(touched.updatedAt).toBe(later);
    expect(touched.createdAt).toBe(now);
    expect(touched.title).toBe("X");
  });
});

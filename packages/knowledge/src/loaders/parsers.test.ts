import { describe, expect, it } from "vitest";
import { isErr, isOk } from "@telemax/core";
import {
  JsonStructuredParser,
  YamlStructuredParser,
  asStructured,
  metadataFromStructured,
  parseFrontMatter,
} from "./parsers.js";

describe("asStructured", () => {
  it("accepts JSON-compatible values", () => {
    const result = asStructured({ a: 1, b: [true, "x", null] });
    expect(isOk(result)).toBe(true);
  });
});

describe("JsonStructuredParser", () => {
  it("parses valid JSON", () => {
    const result = new JsonStructuredParser().parse('{"title":"T","tags":["a","b"]}');
    expect(isOk(result)).toBe(true);
  });
  it("reports invalid JSON", () => {
    const result = new JsonStructuredParser().parse("{not json}");
    expect(isErr(result)).toBe(true);
  });
});

describe("YamlStructuredParser (subset)", () => {
  const parser = new YamlStructuredParser();

  it("parses maps, nested maps, scalars and typed values", () => {
    const result = parser.parse(
      ["title: Hello", "meta:", "  count: 3", "  flag: true", "  empty: null"].join("\n"),
    );
    expect(isOk(result)).toBe(true);
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value).toEqual({
      title: "Hello",
      meta: { count: 3, flag: true, empty: null },
    });
  });

  it("parses block and flow sequences of scalars", () => {
    const result = parser.parse(["tags:", "  - a", "  - b", "cats: [x, y]"].join("\n"));
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value).toEqual({ tags: ["a", "b"], cats: ["x", "y"] });
  });

  it("rejects sequences of maps (unsupported subset)", () => {
    const result = parser.parse(["items:", "  - key: 1"].join("\n"));
    expect(isErr(result)).toBe(true);
  });
});

describe("parseFrontMatter", () => {
  it("splits front-matter and body", () => {
    const { frontMatter, body } = parseFrontMatter("---\ntitle: T\n---\nBody text");
    expect(frontMatter).toContain("title: T");
    expect(body.trim()).toBe("Body text");
  });
  it("returns body only when no front-matter", () => {
    const { frontMatter, body } = parseFrontMatter("no front matter");
    expect(frontMatter).toBeUndefined();
    expect(body).toBe("no front matter");
  });
});

describe("metadataFromStructured", () => {
  it("maps known keys and routes the rest to custom", () => {
    const input = metadataFromStructured({
      title: "T",
      tags: ["a", "b"],
      categories: "news",
      extra: 42,
    });
    expect(input.title).toBe("T");
    expect(input.tags).toEqual(["a", "b"]);
    expect(input.categories).toEqual(["news"]);
    expect(input.custom).toEqual({ extra: 42 });
  });
});

import { describe, expect, it } from "vitest";
import { isErr, isOk } from "@telemax/core";
import { ImageLoader, PdfLoader } from "./binary-loaders.js";
import { JsonLoader } from "./json-loader.js";
import { MarkdownLoader } from "./markdown-loader.js";
import { YamlLoader } from "./yaml-loader.js";
import { systemClock, uuidIdGenerator } from "../utils.js";

const deps = { clock: systemClock, idGenerator: uuidIdGenerator, defaultLanguage: "en" };

describe("MarkdownLoader", () => {
  it("extracts front-matter into metadata and keeps the body", async () => {
    const loader = new MarkdownLoader(deps);
    const result = await loader.load({
      ref: "docs/intro.md",
      format: "markdown",
      content: "---\ntitle: Intro\ntags: [guide]\n---\n# Body\n",
    });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.metadata.title).toBe("Intro");
    expect(result.value.metadata.tags).toEqual(["guide"]);
    expect(result.value.content).toContain("# Body");
    expect(result.value.id).toBe("docs-intro-md");
  });
});

describe("JsonLoader", () => {
  it("parses JSON and derives metadata", async () => {
    const loader = new JsonLoader(deps);
    const result = await loader.load({
      ref: "data",
      format: "json",
      content: '{"title":"Data","categories":["ref"]}',
    });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.metadata.title).toBe("Data");
    expect(result.value.metadata.categories).toEqual(["ref"]);
  });
});

describe("YamlLoader", () => {
  it("parses YAML and derives metadata", async () => {
    const loader = new YamlLoader(deps);
    const result = await loader.load({
      ref: "cfg",
      format: "yaml",
      content: "title: Config\ntags:\n  - a\n  - b\n",
    });
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.metadata.title).toBe("Config");
    expect(result.value.metadata.tags).toEqual(["a", "b"]);
  });
});

describe("prepared binary loaders", () => {
  it("PdfLoader is prepared but not implemented", async () => {
    const result = await new PdfLoader().load({ ref: "f.pdf", format: "pdf", content: "" });
    expect(isErr(result)).toBe(true);
  });
  it("ImageLoader is prepared but not implemented", async () => {
    const result = await new ImageLoader().load({ ref: "f.png", format: "image", content: "" });
    expect(isErr(result)).toBe(true);
  });
  it("supports() reflects declared formats", () => {
    expect(new PdfLoader().supports("pdf")).toBe(true);
    expect(new ImageLoader().supports("pdf")).toBe(false);
    expect(isOk).toBeTypeOf("function");
  });
});

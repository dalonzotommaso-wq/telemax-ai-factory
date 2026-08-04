import { isErr } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { resolveInheritance } from "./inheritance.js";
import { PromptTemplate } from "../domain/template.js";
import { createPromptMetadata } from "../domain/metadata.js";
import { asTemplateId, type TemplateId } from "../types.js";

const meta = createPromptMetadata({}, "2026-01-01T00:00:00.000Z", "en");

function tpl(id: string, body: string, extendsId?: string): PromptTemplate {
  return PromptTemplate.create({
    id: asTemplateId(id),
    name: id,
    body,
    format: "text",
    variables: [],
    metadata: meta,
    ...(extendsId !== undefined ? { extendsId: asTemplateId(extendsId) } : {}),
  });
}

function resolve(t: PromptTemplate, map: Map<string, PromptTemplate>): string {
  const result = resolveInheritance(t, (id: TemplateId) => map.get(id), "en");
  if (isErr(result)) {
    throw result.error;
  }
  return result.value;
}

describe("resolveInheritance", () => {
  it("overrides a parent block from the child", () => {
    const parent = tpl("parent", "Intro\n{{#block content}}default{{/block}}\nOutro");
    const child = tpl("child", "{{#block content}}child body{{/block}}", "parent");
    const map = new Map([
      ["parent", parent],
      ["child", child],
    ]);
    expect(resolve(child, map)).toBe("Intro\nchild body\nOutro");
  });

  it("keeps the parent default when the child does not override", () => {
    const parent = tpl("parent", "A {{#block b}}D{{/block}} C");
    const child = tpl("child", "no blocks here", "parent");
    const map = new Map([
      ["parent", parent],
      ["child", child],
    ]);
    expect(resolve(child, map)).toBe("A D C");
  });

  it("resolves multi-level inheritance (most-derived wins)", () => {
    const grand = tpl("grand", "[{{#block x}}g{{/block}}]");
    const parent = tpl("parent", "{{#block x}}p{{/block}}", "grand");
    const child = tpl("child", "{{#block x}}c{{/block}}", "parent");
    const map = new Map([
      ["grand", grand],
      ["parent", parent],
      ["child", child],
    ]);
    expect(resolve(child, map)).toBe("[c]");
  });

  it("errors on a missing parent", () => {
    const child = tpl("child", "{{#block x}}c{{/block}}", "ghost");
    const map = new Map([["child", child]]);
    expect(isErr(resolveInheritance(child, (id) => map.get(id), "en"))).toBe(true);
  });
});

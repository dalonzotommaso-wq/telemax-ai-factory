import { isErr } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import { describe, expect, it } from "vitest";
import { DefaultTemplateRenderer } from "./default-renderer.js";
import type { RenderContext } from "../interfaces.js";

const renderer = new DefaultTemplateRenderer();

function ctx(
  variables: Record<string, StructuredValue>,
  partials: Record<string, string> = {},
  strict = false,
): RenderContext {
  return { variables, partials, strict };
}

function render(source: string, context: RenderContext): string {
  const result = renderer.render(source, context);
  if (isErr(result)) {
    throw result.error;
  }
  return result.value;
}

describe("DefaultTemplateRenderer", () => {
  it("interpolates variables and dotted paths", () => {
    expect(render("Hello {{name}}!", ctx({ name: "Ada" }))).toBe("Hello Ada!");
    expect(render("{{user.name}}", ctx({ user: { name: "Bob" } }))).toBe("Bob");
  });

  it("handles if/else and unless", () => {
    const tpl = "{{#if flag}}Y{{else}}N{{/if}}";
    expect(render(tpl, ctx({ flag: true }))).toBe("Y");
    expect(render(tpl, ctx({ flag: false }))).toBe("N");
    expect(render("{{#unless flag}}N{{/unless}}", ctx({ flag: false }))).toBe("N");
    expect(render("{{#unless flag}}N{{/unless}}", ctx({ flag: true }))).toBe("");
  });

  it("iterates with each, this and @index", () => {
    expect(
      render("{{#each items}}[{{@index}}:{{this}}]{{/each}}", ctx({ items: ["a", "b"] })),
    ).toBe("[0:a][1:b]");
    expect(render("{{#each items}}{{k}}{{/each}}", ctx({ items: [{ k: "x" }, { k: "y" }] }))).toBe(
      "xy",
    );
  });

  it("includes partials and renders blocks and comments", () => {
    expect(render("{{> greet}}", ctx({ name: "Zoe" }, { greet: "Hi {{name}}" }))).toBe("Hi Zoe");
    expect(render("{{#block a}}X{{/block}}", ctx({}))).toBe("X");
    expect(render("a{{! comment }}b", ctx({}))).toBe("ab");
  });

  it("is lenient by default but errors in strict mode on missing variables", () => {
    expect(render("{{missing}}", ctx({}))).toBe("");
    expect(isErr(renderer.render("{{missing}}", ctx({}, {}, true)))).toBe(true);
  });

  it("errors on a non-list each in strict mode", () => {
    expect(render("{{#each x}}{{this}}{{/each}}", ctx({ x: "nope" }))).toBe("");
    expect(
      isErr(renderer.render("{{#each x}}{{this}}{{/each}}", ctx({ x: "nope" }, {}, true))),
    ).toBe(true);
  });

  it("errors on unbalanced blocks", () => {
    expect(isErr(renderer.render("{{#if a}}open", ctx({ a: true })))).toBe(true);
  });
});

/**
 * {@link DefaultTemplateRenderer} — a dependency-free template engine.
 *
 * Supports interpolation (`{{ path }}`, dotted paths, `{{this}}`, `{{@index}}`),
 * conditionals (`{{#if}}…{{else}}…{{/if}}`, `{{#unless}}…{{/unless}}`),
 * iteration (`{{#each list}}…{{/each}}`), partials (`{{> name}}`), block
 * wrappers (`{{#block name}}…{{/block}}`) and comments (`{{! … }}`). It is a
 * {@link TemplateRenderer} adapter and can be replaced via DI.
 */
import { err, ok, type Result } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import { PromptRenderError, type PromptError } from "../errors.js";
import type { RenderContext, TemplateRenderer } from "../interfaces.js";

type Node = TextNode | InterpNode | PartialNode | IfNode | UnlessNode | EachNode | BlockNode;

interface TextNode {
  readonly kind: "text";
  readonly value: string;
}
interface InterpNode {
  readonly kind: "interp";
  readonly path: string;
}
interface PartialNode {
  readonly kind: "partial";
  readonly name: string;
}
interface IfNode {
  readonly kind: "if";
  readonly path: string;
  readonly then: readonly Node[];
  readonly otherwise: readonly Node[];
}
interface UnlessNode {
  readonly kind: "unless";
  readonly path: string;
  readonly body: readonly Node[];
}
interface EachNode {
  readonly kind: "each";
  readonly path: string;
  readonly body: readonly Node[];
}
interface BlockNode {
  readonly kind: "block";
  readonly body: readonly Node[];
}

interface Frame {
  readonly item: StructuredValue | undefined;
  readonly index: number | undefined;
}

class RenderFailure extends Error {}

export class DefaultTemplateRenderer implements TemplateRenderer {
  private readonly partialDepthLimit = 32;

  public render(source: string, context: RenderContext): Result<string, PromptError> {
    try {
      const nodes = DefaultTemplateRenderer.parse(source);
      const out = this.evaluate(nodes, context, context.variables, [], 0);
      return ok(out);
    } catch (cause) {
      if (cause instanceof RenderFailure) {
        return err(new PromptRenderError(cause.message));
      }
      return err(new PromptRenderError("Template rendering failed.", { cause }));
    }
  }

  private static parse(source: string): readonly Node[] {
    const tokens = DefaultTemplateRenderer.tokenize(source);
    let position = 0;

    const parseUntil = (closers: readonly string[]): { nodes: Node[]; closer: string } => {
      const nodes: Node[] = [];
      while (position < tokens.length) {
        const token = tokens[position];
        if (token === undefined) {
          break;
        }
        position += 1;
        if (token.type === "text") {
          nodes.push({ kind: "text", value: token.value });
          continue;
        }
        const content = token.value.trim();
        if (content.startsWith("!")) {
          continue;
        }
        if (content.startsWith(">")) {
          nodes.push({ kind: "partial", name: content.slice(1).trim() });
          continue;
        }
        if (content.startsWith("#")) {
          const inner = content.slice(1).trim();
          const [keyword, argument] = DefaultTemplateRenderer.splitFirst(inner);
          if (keyword === "if") {
            const thenPart = parseUntil(["else", "/if"]);
            let otherwise: Node[] = [];
            if (thenPart.closer === "else") {
              otherwise = parseUntil(["/if"]).nodes;
            }
            nodes.push({ kind: "if", path: argument, then: thenPart.nodes, otherwise });
          } else if (keyword === "unless") {
            const body = parseUntil(["/unless"]).nodes;
            nodes.push({ kind: "unless", path: argument, body });
          } else if (keyword === "each") {
            const body = parseUntil(["/each"]).nodes;
            nodes.push({ kind: "each", path: argument, body });
          } else if (keyword === "block") {
            const body = parseUntil(["/block"]).nodes;
            nodes.push({ kind: "block", body });
          } else {
            throw new RenderFailure(`Unknown block "${keyword}".`);
          }
          continue;
        }
        if (content.startsWith("/") || content === "else") {
          const marker = content.startsWith("/") ? content : "else";
          if (closers.includes(marker)) {
            return { nodes, closer: marker };
          }
          throw new RenderFailure(`Unexpected "${content}".`);
        }
        nodes.push({ kind: "interp", path: content });
      }
      if (closers.length > 0) {
        throw new RenderFailure(`Missing closing tag for "${closers.join('" / "')}".`);
      }
      return { nodes, closer: "" };
    };

    return parseUntil([]).nodes;
  }

  private static tokenize(source: string): readonly { type: "text" | "tag"; value: string }[] {
    const tokens: { type: "text" | "tag"; value: string }[] = [];
    const pattern = /\{\{([\s\S]*?)\}\}/g;
    let last = 0;
    let match = pattern.exec(source);
    while (match !== null) {
      if (match.index > last) {
        tokens.push({ type: "text", value: source.slice(last, match.index) });
      }
      tokens.push({ type: "tag", value: match[1] ?? "" });
      last = match.index + match[0].length;
      match = pattern.exec(source);
    }
    if (last < source.length) {
      tokens.push({ type: "text", value: source.slice(last) });
    }
    return tokens;
  }

  private static splitFirst(input: string): [string, string] {
    const trimmed = input.trim();
    const space = trimmed.indexOf(" ");
    if (space < 0) {
      return [trimmed, ""];
    }
    return [trimmed.slice(0, space), trimmed.slice(space + 1).trim()];
  }

  private evaluate(
    nodes: readonly Node[],
    context: RenderContext,
    root: Readonly<Record<string, StructuredValue>>,
    frames: readonly Frame[],
    depth: number,
  ): string {
    let out = "";
    for (const node of nodes) {
      switch (node.kind) {
        case "text":
          out += node.value;
          break;
        case "interp":
          out += stringify(this.resolve(node.path, root, frames, context));
          break;
        case "partial":
          out += this.renderPartial(node.name, context, root, frames, depth);
          break;
        case "if":
          out += truthy(this.resolve(node.path, root, frames, context))
            ? this.evaluate(node.then, context, root, frames, depth)
            : this.evaluate(node.otherwise, context, root, frames, depth);
          break;
        case "unless":
          out += truthy(this.resolve(node.path, root, frames, context))
            ? ""
            : this.evaluate(node.body, context, root, frames, depth);
          break;
        case "each":
          out += this.renderEach(node, context, root, frames, depth);
          break;
        case "block":
          out += this.evaluate(node.body, context, root, frames, depth);
          break;
        default:
          throw new RenderFailure("Unsupported node.");
      }
    }
    return out;
  }

  private renderEach(
    node: EachNode,
    context: RenderContext,
    root: Readonly<Record<string, StructuredValue>>,
    frames: readonly Frame[],
    depth: number,
  ): string {
    const value = this.resolve(node.path, root, frames, context);
    if (!Array.isArray(value)) {
      if (context.strict) {
        throw new RenderFailure(`"${node.path}" is not a list.`);
      }
      return "";
    }
    const items = value as readonly StructuredValue[];
    let out = "";
    let index = 0;
    for (const item of items) {
      out += this.evaluate(node.body, context, root, [...frames, { item, index }], depth);
      index += 1;
    }
    return out;
  }

  private renderPartial(
    name: string,
    context: RenderContext,
    root: Readonly<Record<string, StructuredValue>>,
    frames: readonly Frame[],
    depth: number,
  ): string {
    if (depth >= this.partialDepthLimit) {
      throw new RenderFailure(`Partial recursion limit reached at "${name}".`);
    }
    const source = context.partials[name];
    if (source === undefined) {
      if (context.strict) {
        throw new RenderFailure(`Unknown partial "${name}".`);
      }
      return "";
    }
    const nodes = DefaultTemplateRenderer.parse(source);
    return this.evaluate(nodes, context, root, frames, depth + 1);
  }

  private resolve(
    path: string,
    root: Readonly<Record<string, StructuredValue>>,
    frames: readonly Frame[],
    context: RenderContext,
  ): StructuredValue | undefined {
    const top = frames[frames.length - 1];
    if (path === "this") {
      return top?.item;
    }
    if (path === "@index") {
      return top?.index;
    }
    const segments = path.split(".");
    const head = segments[0] ?? "";
    let current: StructuredValue | undefined;
    if (top?.item !== undefined && isObject(top.item) && head in top.item) {
      current = top.item[head];
    } else {
      current = root[head];
    }
    for (let i = 1; i < segments.length; i += 1) {
      const key = segments[i] ?? "";
      if (isObject(current) && key in current) {
        current = current[key];
      } else {
        current = undefined;
        break;
      }
    }
    if (current === undefined && context.strict) {
      throw new RenderFailure(`Unknown variable "${path}".`);
    }
    return current;
  }
}

function isObject(
  value: StructuredValue | undefined,
): value is Readonly<Record<string, StructuredValue>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function truthy(value: StructuredValue | undefined): boolean {
  if (value === undefined || value === null || value === false || value === "" || value === 0) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
}

function stringify(value: StructuredValue | undefined): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

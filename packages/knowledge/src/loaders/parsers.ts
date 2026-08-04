/**
 * Content parsers.
 *
 * `asStructured` safely narrows an `unknown` (e.g. from `JSON.parse`) into a
 * {@link StructuredValue}. `JsonStructuredParser` and `YamlStructuredParser`
 * implement the {@link StructuredTextParser} port; the YAML parser handles a
 * documented, common subset and can be swapped for a full parser via DI.
 */
import { err, isErr, ok, type Result } from "@telemax/core";
import { KnowledgeParseError, type KnowledgeError } from "../errors.js";
import type { StructuredTextParser } from "../interfaces.js";
import type { MetadataInput } from "../domain/metadata.js";
import type { StructuredObject, StructuredValue } from "../types.js";

const KNOWN_METADATA_KEYS: ReadonlySet<string> = new Set([
  "title",
  "description",
  "author",
  "language",
  "source",
  "categories",
  "tags",
]);

/** Recursively validate an unknown value into a {@link StructuredValue}. */
export function asStructured(value: unknown): Result<StructuredValue, KnowledgeError> {
  if (value === null) {
    return ok(null);
  }
  const kind = typeof value;
  if (kind === "boolean" || kind === "number" || kind === "string") {
    return ok(value as boolean | number | string);
  }
  if (Array.isArray(value)) {
    const source = value as readonly unknown[];
    const out: StructuredValue[] = [];
    for (const element of source) {
      const parsed = asStructured(element);
      if (isErr(parsed)) {
        return parsed;
      }
      out.push(parsed.value);
    }
    return ok(out);
  }
  if (kind === "object") {
    const record = value as Record<string, unknown>;
    const out: Record<string, StructuredValue> = {};
    for (const key of Object.keys(record)) {
      const parsed = asStructured(record[key]);
      if (isErr(parsed)) {
        return parsed;
      }
      out[key] = parsed.value;
    }
    return ok(out);
  }
  return err(new KnowledgeParseError(`Unsupported value type: ${kind}`));
}

/** JSON parser backed by the platform `JSON.parse`. */
export class JsonStructuredParser implements StructuredTextParser {
  public parse(text: string): Result<StructuredValue, KnowledgeError> {
    let raw: unknown;
    try {
      raw = JSON.parse(text) as unknown;
    } catch (cause) {
      return err(new KnowledgeParseError("Invalid JSON content.", { cause }));
    }
    return asStructured(raw);
  }
}

interface YamlLine {
  readonly indent: number;
  readonly text: string;
}

/**
 * Minimal YAML parser for a common subset:
 * nested maps, block/flow sequences of scalars, and scalar typing
 * (null/~, booleans, numbers, quoted and plain strings). Not supported:
 * sequences of maps, flow maps, anchors, multi-line scalars, inline comments.
 * For full YAML, inject a different {@link StructuredTextParser}.
 */
export class YamlStructuredParser implements StructuredTextParser {
  public parse(text: string): Result<StructuredValue, KnowledgeError> {
    try {
      const lines = YamlStructuredParser.lex(text);
      const first = lines[0];
      if (first === undefined) {
        return ok({});
      }
      const [value] = YamlStructuredParser.parseNodes(lines, 0, first.indent);
      return ok(value);
    } catch (cause) {
      return err(new KnowledgeParseError("Invalid YAML (supported subset only).", { cause }));
    }
  }

  private static lex(text: string): readonly YamlLine[] {
    const out: YamlLine[] = [];
    for (const rawLine of text.split("\n")) {
      const line = rawLine.replace(/\r$/, "");
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith("#")) {
        continue;
      }
      const indent = line.length - line.trimStart().length;
      out.push({ indent, text: trimmed });
    }
    return out;
  }

  private static parseNodes(
    lines: readonly YamlLine[],
    index: number,
    indent: number,
  ): [StructuredValue, number] {
    const first = lines[index];
    if (first === undefined || first.indent < indent) {
      return [{}, index];
    }
    if (first.text.startsWith("- ")) {
      return YamlStructuredParser.parseSequence(lines, index, indent);
    }
    return YamlStructuredParser.parseMap(lines, index, indent);
  }

  private static parseMap(
    lines: readonly YamlLine[],
    index: number,
    indent: number,
  ): [StructuredValue, number] {
    const obj: Record<string, StructuredValue> = {};
    let i = index;
    while (i < lines.length) {
      const line = lines[i];
      if (line === undefined || line.indent < indent) {
        break;
      }
      if (line.indent > indent) {
        throw new Error("Unexpected indentation in mapping.");
      }
      const pair = YamlStructuredParser.splitKey(line.text);
      if (pair === null) {
        throw new Error(`Expected "key: value" but got: ${line.text}`);
      }
      const [key, rest] = pair;
      if (rest.length === 0) {
        const next = lines[i + 1];
        if (next !== undefined && next.text.startsWith("- ") && next.indent >= indent) {
          const [child, ni] = YamlStructuredParser.parseSequence(lines, i + 1, next.indent);
          obj[key] = child;
          i = ni;
        } else if (next !== undefined && next.indent > indent) {
          const [child, ni] = YamlStructuredParser.parseNodes(lines, i + 1, next.indent);
          obj[key] = child;
          i = ni;
        } else {
          obj[key] = null;
          i += 1;
        }
      } else {
        obj[key] = YamlStructuredParser.parseScalarOrFlow(rest);
        i += 1;
      }
    }
    return [obj, i];
  }

  private static parseSequence(
    lines: readonly YamlLine[],
    index: number,
    indent: number,
  ): [StructuredValue, number] {
    const arr: StructuredValue[] = [];
    let i = index;
    while (i < lines.length) {
      const line = lines[i];
      if (line === undefined || line.indent < indent || !line.text.startsWith("- ")) {
        break;
      }
      if (line.indent > indent) {
        throw new Error("Unexpected indentation in sequence.");
      }
      const itemText = line.text.slice(2).trim();
      if (itemText.length === 0) {
        throw new Error("Empty sequence items are not supported.");
      }
      if (YamlStructuredParser.splitKey(itemText) !== null && !itemText.startsWith('"')) {
        throw new Error("Sequences of maps are not supported by the built-in parser.");
      }
      arr.push(YamlStructuredParser.parseScalarOrFlow(itemText));
      i += 1;
    }
    return [arr, i];
  }

  private static splitKey(text: string): [string, string] | null {
    const match = /^([^:]+):\s*(.*)$/.exec(text);
    if (match === null) {
      return null;
    }
    const key = match[1];
    const value = match[2];
    if (key === undefined) {
      return null;
    }
    return [key.trim(), (value ?? "").trim()];
  }

  private static parseScalarOrFlow(input: string): StructuredValue {
    const text = input.trim();
    if (text.startsWith("[") && text.endsWith("]")) {
      const inner = text.slice(1, -1).trim();
      if (inner.length === 0) {
        return [];
      }
      return inner.split(",").map((part) => YamlStructuredParser.parseScalar(part.trim()));
    }
    return YamlStructuredParser.parseScalar(text);
  }

  private static parseScalar(input: string): StructuredValue {
    const text = input.trim();
    if (text.length === 0 || text === "null" || text === "~") {
      return text.length === 0 ? "" : null;
    }
    if (text === "true") {
      return true;
    }
    if (text === "false") {
      return false;
    }
    if (
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith("'") && text.endsWith("'"))
    ) {
      return text.slice(1, -1);
    }
    if (/^-?\d+(\.\d+)?$/.test(text)) {
      return Number(text);
    }
    return text;
  }
}

/** Split a Markdown document into optional YAML front-matter and body. */
export function parseFrontMatter(text: string): {
  readonly frontMatter?: string;
  readonly body: string;
} {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(text);
  if (match === null) {
    return { body: text };
  }
  const frontMatter = match[1] ?? "";
  const body = match[2] ?? "";
  return { frontMatter, body };
}

/** Extract a {@link MetadataInput} from a structured object (known keys). */
export function metadataFromStructured(value: StructuredValue): MetadataInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const record: StructuredObject = value as StructuredObject;
  const custom: Record<string, StructuredValue> = {};
  for (const key of Object.keys(record)) {
    if (!KNOWN_METADATA_KEYS.has(key)) {
      const entry = record[key];
      if (entry !== undefined) {
        custom[key] = entry;
      }
    }
  }
  const title = asString(record["title"]);
  const description = asString(record["description"]);
  const author = asString(record["author"]);
  const language = asString(record["language"]);
  const source = asString(record["source"]);
  const categories = asStringList(record["categories"]);
  const tags = asStringList(record["tags"]);
  return {
    custom,
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(author !== undefined ? { author } : {}),
    ...(language !== undefined ? { language } : {}),
    ...(source !== undefined ? { source } : {}),
    ...(categories !== undefined ? { categories } : {}),
    ...(tags !== undefined ? { tags } : {}),
  };
}

function asString(value: StructuredValue | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asStringList(value: StructuredValue | undefined): readonly string[] | undefined {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  return undefined;
}

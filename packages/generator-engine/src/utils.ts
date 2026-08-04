/**
 * Utilities. Cross-cutting primitives are reused from `@telemax/knowledge`
 * (no duplicated logic); adds canonical hashing and `{{var}}` interpolation.
 */
import { checksum } from "@telemax/knowledge";
import type { StructuredValue } from "@telemax/knowledge";

export {
  checksum,
  slugify,
  normalizeLabels,
  systemClock,
  uuidIdGenerator,
} from "@telemax/knowledge";
export type { Clock, IdGenerator } from "@telemax/knowledge";

/** Deterministically serialize a structured value with sorted object keys. */
export function canonicalize(value: StructuredValue): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  const object = value as Record<string, StructuredValue>;
  const keys = Object.keys(object).sort();
  const entries = keys.map((key) => {
    const entry = object[key];
    const serialized = entry === undefined ? "null" : canonicalize(entry);
    return `${JSON.stringify(key)}:${serialized}`;
  });
  return `{${entries.join(",")}}`;
}

/** Stable hash (hex SHA-256) of a structured value. */
export function hashValue(value: StructuredValue): string {
  return checksum(canonicalize(value));
}

/** Convert a structured value to a string for interpolation. */
function stringify(value: StructuredValue | undefined): string {
  if (value === undefined || value === null) {
    return "";
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}

/** Replace `{{key}}` placeholders using `variables` (missing keys become empty). */
export function interpolate(
  template: string,
  variables: Readonly<Record<string, StructuredValue>>,
): string {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key: string) =>
    stringify(variables[key]),
  );
}

/**
 * Utilities. Cross-cutting primitives are reused from `@telemax/knowledge`
 * (no duplicated logic); this module re-exports them and adds canonical hashing.
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

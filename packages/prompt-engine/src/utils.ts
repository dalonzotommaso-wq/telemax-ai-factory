/**
 * Utilities. Cross-cutting primitives are reused from `@telemax/knowledge`
 * (no duplicated logic); this module re-exports them and adds prompt-specific
 * helpers (canonical signatures, stable value hashing).
 */
import { checksum } from "@telemax/knowledge";
import type { StructuredValue, StructuredObject } from "@telemax/knowledge";

export {
  checksum,
  slugify,
  tokenize,
  normalizeLabels,
  systemClock,
  uuidIdGenerator,
} from "@telemax/knowledge";
export type { Clock, IdGenerator } from "@telemax/knowledge";

/**
 * Deterministically serialize a structured value with sorted object keys, so
 * equal values always produce the same string (used for signatures/hashes).
 */
export function canonicalize(value: StructuredValue): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  const object = value as StructuredObject;
  const keys = Object.keys(object).sort();
  const entries = keys.map((key) => {
    const entry = object[key];
    const serialized = entry === undefined ? "null" : canonicalize(entry);
    return `${JSON.stringify(key)}:${serialized}`;
  });
  return `{${entries.join(",")}}`;
}

/** Stable hash of a structured value (hex SHA-256 of its canonical form). */
export function hashValue(value: StructuredValue): string {
  return checksum(canonicalize(value));
}

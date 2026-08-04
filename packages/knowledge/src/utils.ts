/**
 * Small, dependency-free utilities (id generation, hashing, slugs, tokens).
 *
 * IO-ish helpers are exposed behind tiny ports ({@link Clock}, {@link IdGenerator})
 * so they can be substituted in tests via dependency injection.
 */
import { createHash, randomUUID } from "node:crypto";

/** A source of the current time (injectable for determinism). */
export interface Clock {
  now(): Date;
}

/** Generates unique identifiers (injectable for determinism). */
export interface IdGenerator {
  next(): string;
}

/** Default clock backed by the system time. */
export const systemClock: Clock = {
  now: (): Date => new Date(),
};

/** Default id generator backed by RFC-4122 UUIDs. */
export const uuidIdGenerator: IdGenerator = {
  next: (): string => randomUUID(),
};

/** Compute a stable SHA-256 hex checksum of a string. */
export function checksum(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

/** Normalize arbitrary text into a URL/identifier-safe slug. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Split text into lowercase word tokens (length >= 2) for indexing/search. */
export function tokenize(text: string): readonly string[] {
  const matches = text.toLowerCase().match(/[a-z0-9]+/g);
  if (matches === null) {
    return [];
  }
  return matches.filter((token) => token.length >= 2);
}

/** Normalize a list of raw labels into a de-duplicated list of slugs. */
export function normalizeLabels(labels: readonly string[] | undefined): readonly string[] {
  if (labels === undefined) {
    return [];
  }
  const seen = new Set<string>();
  for (const label of labels) {
    const slug = slugify(label);
    if (slug.length > 0) {
      seen.add(slug);
    }
  }
  return [...seen];
}

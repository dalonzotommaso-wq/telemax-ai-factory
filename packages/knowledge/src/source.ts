/**
 * Knowledge sources.
 *
 * The {@link KnowledgeSource} port lives in interfaces.ts; this module provides
 * a simple in-memory source, useful as a default and in tests. Filesystem and
 * remote sources are future adapters implementing the same port.
 */
import { ok, type Result } from "@telemax/core";
import type { KnowledgeSource } from "./interfaces.js";
import type { KnowledgeError } from "./errors.js";
import type { RawDocument } from "./types.js";

export { type KnowledgeSource } from "./interfaces.js";

/** A source backed by an in-memory list of raw documents. */
export class InMemoryKnowledgeSource implements KnowledgeSource {
  public readonly id: string;
  private readonly items: readonly RawDocument[];

  public constructor(id: string, items: readonly RawDocument[]) {
    this.id = id;
    this.items = items;
  }

  public list(): Promise<Result<readonly RawDocument[], KnowledgeError>> {
    return Promise.resolve(ok(this.items));
  }
}

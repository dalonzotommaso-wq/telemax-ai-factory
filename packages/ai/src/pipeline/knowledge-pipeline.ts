/**
 * {@link KnowledgePipeline} — retrieves context snippets from the Knowledge
 * Engine through a {@link KnowledgeGateway} port. Ships a null gateway (empty
 * context) and a static gateway for tests; a real `@telemax/knowledge`-backed
 * adapter plugs in later. No external calls happen here.
 */
import { ok, type Result } from "@telemax/core";
import type { ContextSnippet } from "../domain/context.js";
import type { AIError } from "../errors.js";
import type { KnowledgeGateway } from "../interfaces.js";

/** A gateway that retrieves nothing (default). */
export class NullKnowledgeGateway implements KnowledgeGateway {
  public retrieve(
    _query: string,
    _limit?: number,
  ): Promise<Result<readonly ContextSnippet[], AIError>> {
    return Promise.resolve(ok([]));
  }
}

/** A gateway returning a fixed set of snippets (tests / fixtures). */
export class StaticKnowledgeGateway implements KnowledgeGateway {
  public constructor(private readonly snippets: readonly ContextSnippet[]) {}

  public retrieve(
    _query: string,
    limit?: number,
  ): Promise<Result<readonly ContextSnippet[], AIError>> {
    const result = limit === undefined ? this.snippets : this.snippets.slice(0, limit);
    return Promise.resolve(ok(result));
  }
}

export class KnowledgePipeline {
  public constructor(private readonly gateway: KnowledgeGateway = new NullKnowledgeGateway()) {}

  public retrieve(
    query?: string,
    limit?: number,
  ): Promise<Result<readonly ContextSnippet[], AIError>> {
    if (query === undefined || query.length === 0) {
      return Promise.resolve(ok([]));
    }
    return this.gateway.retrieve(query, limit);
  }
}

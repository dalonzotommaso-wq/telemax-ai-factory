/**
 * {@link JsonLoader} — parses JSON content and derives metadata from well-known
 * top-level keys. The parser is injected (defaults to {@link JsonStructuredParser}).
 */
import { isErr, ok, type Result } from "@telemax/core";
import { KnowledgeLoaderBase, type ExtractResult, type LoaderDeps } from "./loader.js";
import { JsonStructuredParser, metadataFromStructured } from "./parsers.js";
import type { KnowledgeError } from "../errors.js";
import type { StructuredTextParser } from "../interfaces.js";
import type { ContentFormat, RawDocument } from "../types.js";

export class JsonLoader extends KnowledgeLoaderBase {
  public readonly formats: readonly ContentFormat[] = ["json"];
  private readonly parser: StructuredTextParser;

  public constructor(deps?: LoaderDeps & { readonly parser?: StructuredTextParser }) {
    super(deps);
    this.parser = deps?.parser ?? new JsonStructuredParser();
  }

  protected extract(raw: RawDocument): Result<ExtractResult, KnowledgeError> {
    const parsed = this.parser.parse(raw.content);
    if (isErr(parsed)) {
      return parsed;
    }
    return ok({
      content: raw.content,
      parsed: parsed.value,
      metadata: metadataFromStructured(parsed.value),
    });
  }
}

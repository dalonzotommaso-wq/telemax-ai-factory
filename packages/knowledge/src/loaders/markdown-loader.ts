/**
 * {@link MarkdownLoader} — loads Markdown, extracting optional YAML front-matter
 * into metadata and keeping the body as content. The front-matter parser is
 * injected (defaults to the built-in YAML subset parser).
 */
import { isErr, ok, type Result } from "@telemax/core";
import { KnowledgeLoaderBase, type ExtractResult, type LoaderDeps } from "./loader.js";
import { metadataFromStructured, parseFrontMatter, YamlStructuredParser } from "./parsers.js";
import type { KnowledgeError } from "../errors.js";
import type { StructuredTextParser } from "../interfaces.js";
import type { ContentFormat, RawDocument } from "../types.js";

export class MarkdownLoader extends KnowledgeLoaderBase {
  public readonly formats: readonly ContentFormat[] = ["markdown"];
  private readonly frontMatterParser: StructuredTextParser;

  public constructor(deps?: LoaderDeps & { readonly frontMatterParser?: StructuredTextParser }) {
    super(deps);
    this.frontMatterParser = deps?.frontMatterParser ?? new YamlStructuredParser();
  }

  protected extract(raw: RawDocument): Result<ExtractResult, KnowledgeError> {
    const { frontMatter, body } = parseFrontMatter(raw.content);
    if (frontMatter === undefined) {
      return ok({ content: raw.content });
    }
    const parsed = this.frontMatterParser.parse(frontMatter);
    if (isErr(parsed)) {
      return parsed;
    }
    return ok({
      content: body,
      parsed: parsed.value,
      metadata: metadataFromStructured(parsed.value),
    });
  }
}

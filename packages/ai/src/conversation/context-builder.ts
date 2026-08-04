/**
 * {@link ContextBuilder} — assembles a {@link Context} from retrieved snippets and
 * input variables, deriving a system preamble from snippets when none is given.
 */
import type { StructuredValue } from "@telemax/knowledge";
import type { Context, ContextSnippet } from "../domain/context.js";

/** Input to {@link ContextBuilder.build}. */
export interface ContextBuildInput {
  readonly snippets?: readonly ContextSnippet[];
  readonly variables?: Readonly<Record<string, StructuredValue>>;
  readonly system?: string;
}

export class ContextBuilder {
  public build(input: ContextBuildInput): Context {
    const snippets = input.snippets ?? [];
    const variables = input.variables ?? {};
    const system =
      input.system ?? (snippets.length > 0 ? ContextBuilder.renderSystem(snippets) : undefined);
    return {
      snippets,
      variables,
      ...(system !== undefined ? { system } : {}),
    };
  }

  private static renderSystem(snippets: readonly ContextSnippet[]): string {
    const lines = snippets.map((snippet) => `- ${snippet.content}`);
    return `Context:\n${lines.join("\n")}`;
  }
}

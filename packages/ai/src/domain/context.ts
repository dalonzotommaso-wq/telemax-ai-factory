/** Retrieval/assembly context handed to the prompt pipeline. */
import type { StructuredValue } from "@telemax/knowledge";

/** A single retrieved knowledge snippet. */
export interface ContextSnippet {
  readonly source: string;
  readonly content: string;
  readonly score?: number;
}

/** The assembled context for a request. */
export interface Context {
  readonly snippets: readonly ContextSnippet[];
  readonly variables: Readonly<Record<string, StructuredValue>>;
  readonly system?: string;
}

/** An empty context (no retrieval, no variables). */
export const EMPTY_CONTEXT: Context = { snippets: [], variables: {} };

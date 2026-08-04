/**
 * Prepared data types for advanced capabilities. These describe the shapes the
 * engine will support in future sprints (Prompt Chains, Tool/Function calling,
 * MCP, Structured Output / JSON Schema) without executing anything yet.
 */
import type { StructuredObject } from "@telemax/knowledge";
import type { PromptFormat, TemplateId } from "../types.js";
import type { VariableValues } from "./variable.js";

/** A single step in a prompt chain (prepared). */
export interface ChainStep {
  readonly id: string;
  readonly templateId: TemplateId;
  readonly variables?: VariableValues;
}

/** A prompt-chain definition (prepared; execution not yet implemented). */
export interface PromptChainDefinition {
  readonly id: string;
  readonly steps: readonly ChainStep[];
}

/** A function parameter descriptor (prepared, for tool/function calling). */
export interface FunctionParameter {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly description?: string;
}

/** A function descriptor (prepared). */
export interface FunctionDefinition {
  readonly name: string;
  readonly description?: string;
  readonly parameters: readonly FunctionParameter[];
}

/** A tool descriptor covering function calling and MCP references (prepared). */
export interface ToolDefinition {
  readonly name: string;
  readonly kind: "function" | "mcp";
  readonly function?: FunctionDefinition;
  readonly mcpServer?: string;
}

/** A structured-output specification (prepared, for JSON/XML structured output). */
export interface StructuredOutputSpec {
  readonly format: PromptFormat;
  readonly jsonSchema?: StructuredObject;
}

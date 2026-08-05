/** Centralized configuration for the Workflow Engine (typed object + defaults). */
import type { FailureMode } from "./types.js";

/** The resolved Workflow Engine configuration. */
export interface WorkflowEngineConfig {
  readonly defaultLanguage: string;
  readonly maxParallelism: number;
  readonly defaultStepTimeoutMs: number;
  readonly maxLoopIterations: number;
  readonly enableVersioning: boolean;
  readonly onFailure: FailureMode;
}

/** Partial configuration input accepted by {@link resolveWorkflowConfig}. */
export interface WorkflowEngineConfigInput {
  readonly defaultLanguage?: string;
  readonly maxParallelism?: number;
  readonly defaultStepTimeoutMs?: number;
  readonly maxLoopIterations?: number;
  readonly enableVersioning?: boolean;
  readonly onFailure?: FailureMode;
}

/** Safe, zero-configuration defaults. */
export const DEFAULT_WORKFLOW_CONFIG: WorkflowEngineConfig = {
  defaultLanguage: "en",
  maxParallelism: 8,
  defaultStepTimeoutMs: 30_000,
  maxLoopIterations: 1000,
  enableVersioning: true,
  onFailure: "halt",
};

/** Merge a partial input over {@link DEFAULT_WORKFLOW_CONFIG}. */
export function resolveWorkflowConfig(input?: WorkflowEngineConfigInput): WorkflowEngineConfig {
  const base = DEFAULT_WORKFLOW_CONFIG;
  return {
    defaultLanguage: input?.defaultLanguage ?? base.defaultLanguage,
    maxParallelism: input?.maxParallelism ?? base.maxParallelism,
    defaultStepTimeoutMs: input?.defaultStepTimeoutMs ?? base.defaultStepTimeoutMs,
    maxLoopIterations: input?.maxLoopIterations ?? base.maxLoopIterations,
    enableVersioning: input?.enableVersioning ?? base.enableVersioning,
    onFailure: input?.onFailure ?? base.onFailure,
  };
}

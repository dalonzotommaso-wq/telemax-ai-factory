/**
 * Public API of `@telemax/workflow` — the Workflow Engine.
 *
 * Define reusable, composable workflows that coordinate the AI Orchestrator,
 * Prompt Engine, Knowledge Engine and future Generator Engine. Supports
 * sequential/parallel/branch/loop composition, retry, rollback, timeout, events,
 * logging, metrics, serialization, import/export, versioning and validation.
 * Advanced capabilities (Human Approval, MCP, Tool/Function calling, Multi-Agent,
 * Scheduled and Distributed workflows) are prepared. Infrastructure only.
 */

// Types
export { asWorkflowId } from "./types.js";
export type {
  WorkflowId,
  WorkflowState,
  StepState,
  StepKind,
  ConditionKind,
  FailureMode,
} from "./types.js";

// Errors
export {
  WorkflowValidationError,
  WorkflowNotFoundError,
  WorkflowDuplicateError,
  StepExecutionError,
  WorkflowTimeoutError,
  WorkflowCompilationError,
  WorkflowNotImplementedError,
  WorkflowIoError,
} from "./errors.js";
export type { WorkflowError } from "./errors.js";

// Config
export { DEFAULT_WORKFLOW_CONFIG, resolveWorkflowConfig } from "./config.js";
export type { WorkflowEngineConfig, WorkflowEngineConfigInput } from "./config.js";

// Utils
export {
  canonicalize,
  hashValue,
  checksum,
  slugify,
  normalizeLabels,
  systemClock,
  uuidIdGenerator,
} from "./utils.js";
export type { Clock, IdGenerator } from "./utils.js";

// Events
export { WorkflowEventBus } from "./events.js";
export type { WorkflowEvents, EventBus, EventHandler } from "./events.js";

// Interfaces (ports)
export type {
  StepHandler,
  ConditionEvaluator,
  MetricsSink,
  HumanApprovalGateway,
  ToolInvoker,
  DistributedExecutor,
} from "./interfaces.js";

// Domain
export { createWorkflowMetadata } from "./domain/metadata.js";
export type { WorkflowMetadata, WorkflowMetadataInput } from "./domain/metadata.js";
export type {
  Condition,
  AlwaysCondition,
  VarTruthyCondition,
  VarEqualsCondition,
  NotCondition,
  AllCondition,
  AnyCondition,
} from "./domain/condition.js";
export type { RetryPolicy, TimeoutPolicy, RollbackSpec, RollbackPolicy } from "./domain/policy.js";
export type {
  BaseStep,
  TaskStep,
  SequenceStep,
  ParallelStep,
  BranchStep,
  LoopStep,
  SubworkflowStep,
  ApprovalStep,
  ToolStep,
  WorkflowStep,
} from "./domain/step.js";
export { Workflow } from "./domain/definition.js";
export type { WorkflowDefinition, WorkflowProps } from "./domain/definition.js";
export { createContext, withVariable, withOutput, withState } from "./domain/context.js";
export type { WorkflowContext } from "./domain/context.js";
export type { StepResult, WorkflowResult } from "./domain/result.js";
export type { ScheduleEntry } from "./domain/schedule.js";
export type {
  ApprovalRequest,
  ToolCall,
  FunctionCall,
  AgentRef,
  DistributedPlan,
} from "./domain/advanced.js";

// Condition / handlers
export { DefaultConditionEvaluator } from "./condition/evaluator.js";
export { StepHandlerRegistry } from "./handlers/registry.js";
export { noopHandler, echoHandler, registerBuiltinHandlers } from "./handlers/builtin.js";
export { aiStepHandler, promptStepHandler, knowledgeStepHandler } from "./handlers/adapters.js";

// Execution
export { WorkflowExecutor } from "./execution/executor.js";
export type { ExecutorDeps } from "./execution/executor.js";
export { withTimeout } from "./execution/timeout.js";

// Compiler / validator / registry / scheduler
export { WorkflowCompiler } from "./compiler.js";
export { WorkflowValidator } from "./validator.js";
export { WorkflowRegistry } from "./registry.js";
export type { WorkflowVersion } from "./registry.js";
export { WorkflowScheduler } from "./scheduler.js";

// Metrics
export { NoopMetricsSink, MetricsCollector } from "./metrics.js";

// Import / export
export { ExportManager } from "./export-manager.js";
export type { WorkflowBundle } from "./export-manager.js";
export { ImportManager } from "./import-manager.js";

// Engine
export { WorkflowEngine } from "./engine.js";
export type { WorkflowEngineDeps } from "./engine.js";

// Dependency injection
export {
  registerWorkflowEngine,
  WORKFLOW_CONFIG,
  WORKFLOW_EVENTS,
  WORKFLOW_HANDLERS,
  WORKFLOW_ENGINE,
} from "./di.js";

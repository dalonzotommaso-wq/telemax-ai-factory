/**
 * Workflow definition (raw, serializable) and the compiled {@link Workflow}
 * entity (immutable, carrying checksum and a stable version signature).
 */
import { checksum, hashValue } from "../utils.js";
import type { StructuredValue } from "@telemax/knowledge";
import type { FailureMode, WorkflowId } from "../types.js";
import type { WorkflowMetadata, WorkflowMetadataInput } from "./metadata.js";
import type { WorkflowStep } from "./step.js";

/** A raw, declarative workflow definition. */
export interface WorkflowDefinition {
  readonly id: string;
  readonly name: string;
  readonly version?: number;
  readonly root: WorkflowStep;
  readonly onFailure?: FailureMode;
  readonly metadata?: WorkflowMetadataInput;
}

/** Convert any JSON-safe value into a {@link StructuredValue} for hashing. */
function toStructured(value: unknown): StructuredValue {
  return JSON.parse(JSON.stringify(value)) as StructuredValue;
}

/** Full construction properties for a {@link Workflow}. */
export interface WorkflowProps {
  readonly id: WorkflowId;
  readonly name: string;
  readonly version: number;
  readonly root: WorkflowStep;
  readonly onFailure: FailureMode;
  readonly metadata: WorkflowMetadata;
  readonly checksum: string;
  readonly signature: string;
}

/** An immutable, compiled workflow. */
export class Workflow {
  public readonly id: WorkflowId;
  public readonly name: string;
  public readonly version: number;
  public readonly root: WorkflowStep;
  public readonly onFailure: FailureMode;
  public readonly metadata: WorkflowMetadata;
  public readonly checksum: string;
  public readonly signature: string;

  private constructor(props: WorkflowProps) {
    this.id = props.id;
    this.name = props.name;
    this.version = props.version;
    this.root = props.root;
    this.onFailure = props.onFailure;
    this.metadata = props.metadata;
    this.checksum = props.checksum;
    this.signature = props.signature;
  }

  /** Create a compiled workflow, computing its checksum and signature. */
  public static create(input: {
    readonly id: WorkflowId;
    readonly name: string;
    readonly version: number;
    readonly root: WorkflowStep;
    readonly onFailure: FailureMode;
    readonly metadata: WorkflowMetadata;
  }): Workflow {
    const core = toStructured({ id: input.id, onFailure: input.onFailure, root: input.root });
    return new Workflow({
      ...input,
      checksum: checksum(JSON.stringify(input.root)),
      signature: hashValue(core),
    });
  }

  /** Return a copy carrying a new version number and metadata. */
  public withVersion(version: number, metadata: WorkflowMetadata): Workflow {
    return Workflow.create({
      id: this.id,
      name: this.name,
      version,
      root: this.root,
      onFailure: this.onFailure,
      metadata,
    });
  }
}

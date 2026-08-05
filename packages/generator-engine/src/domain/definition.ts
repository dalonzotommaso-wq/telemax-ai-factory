/**
 * Generator definition (raw, serializable) and the compiled {@link Generator}
 * entity (immutable, carrying checksum and a stable version signature).
 */
import { checksum, hashValue } from "../utils.js";
import type { StructuredValue } from "@telemax/knowledge";
import type { GeneratorId } from "../types.js";
import type { GeneratorConfiguration } from "../config.js";
import type { GeneratorMetadata, GeneratorMetadataInput } from "./metadata.js";
import type { GeneratorPipeline } from "./pipeline.js";
import type { GeneratorTemplate } from "./template.js";

/** A raw, declarative generator definition. */
export interface GeneratorDefinition {
  readonly id: string;
  readonly name: string;
  readonly version?: number;
  readonly target?: string;
  readonly pipeline: GeneratorPipeline;
  readonly templates?: readonly GeneratorTemplate[];
  readonly configuration?: GeneratorConfiguration;
  readonly metadata?: GeneratorMetadataInput;
}

/** Convert any JSON-safe value into a {@link StructuredValue} for hashing. */
function toStructured(value: unknown): StructuredValue {
  return JSON.parse(JSON.stringify(value)) as StructuredValue;
}

/** Full construction properties for a {@link Generator}. */
export interface GeneratorProps {
  readonly id: GeneratorId;
  readonly name: string;
  readonly version: number;
  readonly target: string;
  readonly pipeline: GeneratorPipeline;
  readonly templates: readonly GeneratorTemplate[];
  readonly configuration: GeneratorConfiguration;
  readonly metadata: GeneratorMetadata;
  readonly checksum: string;
  readonly signature: string;
}

/** An immutable, compiled generator. */
export class Generator {
  public readonly id: GeneratorId;
  public readonly name: string;
  public readonly version: number;
  public readonly target: string;
  public readonly pipeline: GeneratorPipeline;
  public readonly templates: readonly GeneratorTemplate[];
  public readonly configuration: GeneratorConfiguration;
  public readonly metadata: GeneratorMetadata;
  public readonly checksum: string;
  public readonly signature: string;

  private constructor(props: GeneratorProps) {
    this.id = props.id;
    this.name = props.name;
    this.version = props.version;
    this.target = props.target;
    this.pipeline = props.pipeline;
    this.templates = props.templates;
    this.configuration = props.configuration;
    this.metadata = props.metadata;
    this.checksum = props.checksum;
    this.signature = props.signature;
  }

  /** Create a compiled generator, computing its checksum and signature. */
  public static create(input: {
    readonly id: GeneratorId;
    readonly name: string;
    readonly version: number;
    readonly target: string;
    readonly pipeline: GeneratorPipeline;
    readonly templates: readonly GeneratorTemplate[];
    readonly configuration: GeneratorConfiguration;
    readonly metadata: GeneratorMetadata;
  }): Generator {
    const core = toStructured({
      id: input.id,
      target: input.target,
      pipeline: input.pipeline,
      templates: input.templates,
      configuration: input.configuration,
    });
    return new Generator({
      ...input,
      checksum: checksum(JSON.stringify(input.pipeline)),
      signature: hashValue(core),
    });
  }

  /** Return a copy carrying a new version number and metadata. */
  public withVersion(version: number, metadata: GeneratorMetadata): Generator {
    return Generator.create({
      id: this.id,
      name: this.name,
      version,
      target: this.target,
      pipeline: this.pipeline,
      templates: this.templates,
      configuration: this.configuration,
      metadata,
    });
  }
}

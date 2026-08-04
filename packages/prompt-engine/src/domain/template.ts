/**
 * The {@link PromptTemplate} entity — an immutable value object holding a
 * template body, its variable schema, metadata, versioning, inheritance and
 * localization. `checksum` covers the body; `signature` covers the whole
 * template (a stable version signature).
 */
import { canonicalize, checksum } from "../utils.js";
import type { StructuredValue } from "@telemax/knowledge";
import type { PromptFormat, PromptRole, TemplateId } from "../types.js";
import type { PromptMetadata } from "./metadata.js";
import type { VariableSchema } from "./variable.js";

/** Full construction properties for a {@link PromptTemplate}. */
export interface PromptTemplateProps {
  readonly id: TemplateId;
  readonly name: string;
  readonly body: string;
  readonly format: PromptFormat;
  readonly variables: VariableSchema;
  readonly metadata: PromptMetadata;
  readonly version: number;
  readonly checksum: string;
  readonly signature: string;
  readonly dependencies: readonly TemplateId[];
  readonly locales: Readonly<Record<string, string>>;
  readonly role?: PromptRole;
  readonly extendsId?: TemplateId;
}

/** Input accepted by {@link PromptTemplate.create}. */
export interface PromptTemplateInput {
  readonly id: TemplateId;
  readonly name: string;
  readonly body: string;
  readonly format: PromptFormat;
  readonly variables: VariableSchema;
  readonly metadata: PromptMetadata;
  readonly version?: number;
  readonly dependencies?: readonly TemplateId[];
  readonly locales?: Readonly<Record<string, string>>;
  readonly role?: PromptRole;
  readonly extendsId?: TemplateId;
}

/** Compute the stable signature (hex SHA-256 over the canonical template core). */
export function computeSignature(input: {
  readonly id: string;
  readonly body: string;
  readonly format: PromptFormat;
  readonly variables: VariableSchema;
  readonly dependencies: readonly string[];
  readonly locales: Readonly<Record<string, string>>;
  readonly role?: PromptRole;
  readonly extendsId?: string;
}): string {
  const core: StructuredValue = {
    id: input.id,
    body: input.body,
    format: input.format,
    role: input.role ?? null,
    extendsId: input.extendsId ?? null,
    dependencies: [...input.dependencies],
    locales: { ...input.locales },
    variables: input.variables.map((variable) => ({
      name: variable.name,
      type: variable.type,
      required: variable.required,
      enumValues: variable.enumValues !== undefined ? [...variable.enumValues] : null,
    })),
  };
  return checksum(canonicalize(core));
}

/** An immutable prompt template. */
export class PromptTemplate {
  public readonly id: TemplateId;
  public readonly name: string;
  public readonly body: string;
  public readonly format: PromptFormat;
  public readonly variables: VariableSchema;
  public readonly metadata: PromptMetadata;
  public readonly version: number;
  public readonly checksum: string;
  public readonly signature: string;
  public readonly dependencies: readonly TemplateId[];
  public readonly locales: Readonly<Record<string, string>>;
  public readonly role?: PromptRole;
  public readonly extendsId?: TemplateId;

  private constructor(props: PromptTemplateProps) {
    this.id = props.id;
    this.name = props.name;
    this.body = props.body;
    this.format = props.format;
    this.variables = props.variables;
    this.metadata = props.metadata;
    this.version = props.version;
    this.checksum = props.checksum;
    this.signature = props.signature;
    this.dependencies = props.dependencies;
    this.locales = props.locales;
    if (props.role !== undefined) {
      this.role = props.role;
    }
    if (props.extendsId !== undefined) {
      this.extendsId = props.extendsId;
    }
  }

  /** Create a template, computing its checksum and signature. */
  public static create(input: PromptTemplateInput): PromptTemplate {
    const dependencies = input.dependencies ?? [];
    const locales = input.locales ?? {};
    const signature = computeSignature({
      id: input.id,
      body: input.body,
      format: input.format,
      variables: input.variables,
      dependencies,
      locales,
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.extendsId !== undefined ? { extendsId: input.extendsId } : {}),
    });
    return new PromptTemplate({
      id: input.id,
      name: input.name,
      body: input.body,
      format: input.format,
      variables: input.variables,
      metadata: input.metadata,
      version: input.version ?? 1,
      checksum: checksum(input.body),
      signature,
      dependencies,
      locales,
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.extendsId !== undefined ? { extendsId: input.extendsId } : {}),
    });
  }

  /** Resolve the body for a locale, falling back to the default body. */
  public bodyFor(locale: string): string {
    return this.locales[locale] ?? this.body;
  }

  /** Return a copy carrying a new version number and metadata. */
  public withVersion(version: number, metadata: PromptMetadata): PromptTemplate {
    return PromptTemplate.create({
      id: this.id,
      name: this.name,
      body: this.body,
      format: this.format,
      variables: this.variables,
      metadata,
      version,
      dependencies: this.dependencies,
      locales: this.locales,
      ...(this.role !== undefined ? { role: this.role } : {}),
      ...(this.extendsId !== undefined ? { extendsId: this.extendsId } : {}),
    });
  }
}

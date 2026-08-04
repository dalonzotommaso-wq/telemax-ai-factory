/**
 * {@link ExportManager} — serializes templates into a portable
 * {@link PromptBundle}. Pairs with {@link file://./import-manager.ts | ImportManager}.
 */
import { isErr, ok, type Result } from "@telemax/core";
import type { PromptTemplate } from "./domain/template.js";
import type { PromptMetadata } from "./domain/metadata.js";
import type { VariableSchema } from "./domain/variable.js";
import type { PromptError } from "./errors.js";
import type { TemplateRepository } from "./interfaces.js";
import type { PromptFormat, PromptRole, TemplateFilter } from "./types.js";
import { systemClock, type Clock } from "./utils.js";

/** A serialized template within a bundle. */
export interface SerializedTemplate {
  readonly id: string;
  readonly name: string;
  readonly body: string;
  readonly format: PromptFormat;
  readonly version: number;
  readonly checksum: string;
  readonly signature: string;
  readonly variables: VariableSchema;
  readonly metadata: PromptMetadata;
  readonly dependencies: readonly string[];
  readonly locales: Readonly<Record<string, string>>;
  readonly role?: PromptRole;
  readonly extendsId?: string;
}

/** A portable prompt bundle (schema version 1). */
export interface PromptBundle {
  readonly version: 1;
  readonly exportedAt: string;
  readonly templates: readonly SerializedTemplate[];
}

export class ExportManager {
  public constructor(
    private readonly repository: TemplateRepository,
    private readonly clock: Clock = systemClock,
  ) {}

  public async export(filter?: TemplateFilter): Promise<Result<PromptBundle, PromptError>> {
    const listed = await this.repository.list(filter);
    if (isErr(listed)) {
      return listed;
    }
    return ok({
      version: 1,
      exportedAt: this.clock.now().toISOString(),
      templates: listed.value.map(serialize),
    });
  }
}

function serialize(template: PromptTemplate): SerializedTemplate {
  return {
    id: template.id,
    name: template.name,
    body: template.body,
    format: template.format,
    version: template.version,
    checksum: template.checksum,
    signature: template.signature,
    variables: template.variables,
    metadata: template.metadata,
    dependencies: [...template.dependencies],
    locales: template.locales,
    ...(template.role !== undefined ? { role: template.role } : {}),
    ...(template.extendsId !== undefined ? { extendsId: template.extendsId } : {}),
  };
}

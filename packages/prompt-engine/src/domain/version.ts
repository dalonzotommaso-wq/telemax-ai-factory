/**
 * Template version snapshots. The repository keeps an ordered history per
 * template; each {@link PromptVersion} captures the signature and checksum.
 */
import type { TemplateId } from "../types.js";
import type { PromptTemplate } from "./template.js";

/** An immutable snapshot of a template version. */
export interface PromptVersion {
  readonly templateId: TemplateId;
  readonly version: number;
  readonly signature: string;
  readonly checksum: string;
  readonly createdAt: string;
  readonly note?: string;
}

/** Build a {@link PromptVersion} snapshot from a template. */
export function versionOf(
  template: PromptTemplate,
  createdAt: string,
  note?: string,
): PromptVersion {
  return {
    templateId: template.id,
    version: template.version,
    signature: template.signature,
    checksum: template.checksum,
    createdAt,
    ...(note !== undefined ? { note } : {}),
  };
}

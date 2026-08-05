/**
 * {@link PromptRegistry} — the extension point for the engine. Extensions
 * contribute reusable named partials; the registry aggregates them for the
 * renderer.
 */
import { PromptDuplicateError } from "./errors.js";
import type { PromptExtension } from "./interfaces.js";

export class PromptRegistry {
  private readonly extensions = new Map<string, PromptExtension>();

  /** Register an extension (by unique id). */
  public registerExtension(extension: PromptExtension): void {
    if (this.extensions.has(extension.id)) {
      throw new PromptDuplicateError(
        `An extension is already registered with id "${extension.id}".`,
      );
    }
    this.extensions.set(extension.id, extension);
  }

  /** List all registered extensions. */
  public listExtensions(): readonly PromptExtension[] {
    return [...this.extensions.values()];
  }

  /** Aggregate the partials contributed by all extensions. */
  public partials(): Readonly<Record<string, string>> {
    const merged: Record<string, string> = {};
    for (const extension of this.extensions.values()) {
      for (const [name, source] of Object.entries(extension.partials())) {
        merged[name] = source;
      }
    }
    return merged;
  }
}

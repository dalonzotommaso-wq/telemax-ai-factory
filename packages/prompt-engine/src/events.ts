/**
 * Event-driven layer. Reuses the generic {@link EventBus} contract from
 * `@telemax/knowledge` and provides a typed in-memory bus for prompt events.
 */
import type { EventBus, EventHandler } from "@telemax/knowledge";
import type { PromptError } from "./errors.js";
import type { CompositionId, PromptFormat, TemplateId } from "./types.js";

/** Map of prompt event name to payload type. */
export interface PromptEvents {
  "template.registered": { readonly templateId: TemplateId; readonly version: number };
  "template.updated": { readonly templateId: TemplateId; readonly previousVersion: number };
  "template.removed": { readonly templateId: TemplateId };
  "prompt.rendered": {
    readonly templateId: TemplateId;
    readonly signature: string;
    readonly cacheHit: boolean;
  };
  "composition.rendered": { readonly compositionId: CompositionId; readonly format: PromptFormat };
  "cache.hit": { readonly key: string };
  "cache.miss": { readonly key: string };
  "import.completed": { readonly imported: number };
  "export.completed": { readonly exported: number };
  "prompt.error": { readonly error: PromptError };
}

export type { EventBus, EventHandler } from "@telemax/knowledge";

/** In-memory, typed prompt event bus. */
export class PromptEventBus implements EventBus<PromptEvents> {
  private readonly handlers = new Map<keyof PromptEvents, Set<EventHandler<unknown>>>();

  public on<K extends keyof PromptEvents>(
    event: K,
    handler: EventHandler<PromptEvents[K]>,
  ): () => void {
    const set = this.handlers.get(event) ?? new Set<EventHandler<unknown>>();
    set.add(handler as EventHandler<unknown>);
    this.handlers.set(event, set);
    return (): void => {
      this.off(event, handler);
    };
  }

  public off<K extends keyof PromptEvents>(event: K, handler: EventHandler<PromptEvents[K]>): void {
    const set = this.handlers.get(event);
    if (set !== undefined) {
      set.delete(handler as EventHandler<unknown>);
    }
  }

  public emit<K extends keyof PromptEvents>(event: K, payload: PromptEvents[K]): void {
    const set = this.handlers.get(event);
    if (set === undefined) {
      return;
    }
    for (const handler of set) {
      handler(payload);
    }
  }
}

/**
 * Event-driven layer.
 *
 * A minimal, fully-typed event bus lets the {@link file://./service.ts | KnowledgeService}
 * announce lifecycle events without coupling to any consumer. Handlers are
 * registered per event name and receive a strongly-typed payload.
 */
import type { Document } from "./domain/document.js";
import type { KnowledgeVersion } from "./domain/version.js";
import type { KnowledgeError } from "./errors.js";
import type { DocumentId } from "./types.js";

/** Map of event name to its payload type. */
export interface KnowledgeEvents {
  "document.registered": { readonly document: Document };
  "document.updated": { readonly document: Document; readonly previousVersion: number };
  "document.removed": { readonly documentId: DocumentId };
  "document.indexed": { readonly documentId: DocumentId };
  "version.created": { readonly version: KnowledgeVersion };
  "import.completed": { readonly imported: number };
  "export.completed": { readonly exported: number };
  "knowledge.error": { readonly error: KnowledgeError };
}

/** A handler for a specific event payload. */
export type EventHandler<TPayload> = (payload: TPayload) => void;

/** A typed publish/subscribe bus. */
export interface EventBus<TEvents> {
  on<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): () => void;
  off<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void;
  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void;
}

/** Default in-memory implementation of {@link EventBus} for knowledge events. */
export class KnowledgeEventBus implements EventBus<KnowledgeEvents> {
  private readonly handlers = new Map<keyof KnowledgeEvents, Set<EventHandler<unknown>>>();

  public on<K extends keyof KnowledgeEvents>(
    event: K,
    handler: EventHandler<KnowledgeEvents[K]>,
  ): () => void {
    const set = this.handlers.get(event) ?? new Set<EventHandler<unknown>>();
    set.add(handler as EventHandler<unknown>);
    this.handlers.set(event, set);
    return (): void => {
      this.off(event, handler);
    };
  }

  public off<K extends keyof KnowledgeEvents>(
    event: K,
    handler: EventHandler<KnowledgeEvents[K]>,
  ): void {
    const set = this.handlers.get(event);
    if (set !== undefined) {
      set.delete(handler as EventHandler<unknown>);
    }
  }

  public emit<K extends keyof KnowledgeEvents>(event: K, payload: KnowledgeEvents[K]): void {
    const set = this.handlers.get(event);
    if (set === undefined) {
      return;
    }
    for (const handler of set) {
      handler(payload);
    }
  }
}

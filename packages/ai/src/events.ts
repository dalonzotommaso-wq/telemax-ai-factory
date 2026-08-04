/**
 * Event-driven layer. Reuses the generic {@link EventBus} contract from
 * `@telemax/knowledge` and provides a typed in-memory bus for orchestrator
 * events.
 */
import type { EventBus, EventHandler } from "@telemax/knowledge";
import type { AIError } from "./errors.js";
import type { HealthState, ModelId, ProviderId } from "./types.js";

/** Map of orchestrator event name to payload type. */
export interface AIEvents {
  "request.received": { readonly requestId: string };
  "context.retrieved": { readonly requestId: string; readonly snippets: number };
  "prompt.built": { readonly requestId: string; readonly messages: number };
  "provider.selected": { readonly requestId: string; readonly providerId: ProviderId };
  "model.selected": { readonly requestId: string; readonly modelId: ModelId };
  "request.prepared": { readonly requestId: string; readonly signature: string };
  "response.received": {
    readonly requestId: string;
    readonly providerId: ProviderId;
    readonly modelId: ModelId;
    readonly totalTokens: number;
    readonly cacheHit: boolean;
  };
  "execution.failed": { readonly requestId: string; readonly error: AIError };
  "provider.health.changed": { readonly providerId: ProviderId; readonly state: HealthState };
  "cache.hit": { readonly key: string };
  "cache.miss": { readonly key: string };
  "cost.tracked": { readonly providerId: ProviderId; readonly cost: number };
}

export type { EventBus, EventHandler } from "@telemax/knowledge";

/** In-memory, typed orchestrator event bus. */
export class AIEventBus implements EventBus<AIEvents> {
  private readonly handlers = new Map<keyof AIEvents, Set<EventHandler<unknown>>>();

  public on<K extends keyof AIEvents>(event: K, handler: EventHandler<AIEvents[K]>): () => void {
    const set = this.handlers.get(event) ?? new Set<EventHandler<unknown>>();
    set.add(handler as EventHandler<unknown>);
    this.handlers.set(event, set);
    return (): void => {
      this.off(event, handler);
    };
  }

  public off<K extends keyof AIEvents>(event: K, handler: EventHandler<AIEvents[K]>): void {
    this.handlers.get(event)?.delete(handler as EventHandler<unknown>);
  }

  public emit<K extends keyof AIEvents>(event: K, payload: AIEvents[K]): void {
    const set = this.handlers.get(event);
    if (set === undefined) {
      return;
    }
    for (const handler of set) {
      handler(payload);
    }
  }
}

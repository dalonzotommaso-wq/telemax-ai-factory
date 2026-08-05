/**
 * Event-driven layer. Reuses the generic {@link EventBus} contract from
 * `@telemax/knowledge` and provides a typed in-memory bus for generator events.
 */
import type { EventBus, EventHandler } from "@telemax/knowledge";
import type { GeneratorError } from "./errors.js";
import type { GeneratorId, StepKind } from "./types.js";

/** Map of generator event name to payload type. */
export interface GeneratorEvents {
  "generator.registered": { readonly generatorId: GeneratorId; readonly version: number };
  "generation.started": { readonly generatorId: GeneratorId; readonly runId: string };
  "generation.completed": {
    readonly generatorId: GeneratorId;
    readonly runId: string;
    readonly artifacts: number;
  };
  "generation.failed": {
    readonly generatorId: GeneratorId;
    readonly runId: string;
    readonly error: GeneratorError;
  };
  "step.started": { readonly runId: string; readonly stepId: string; readonly kind: StepKind };
  "step.completed": { readonly runId: string; readonly stepId: string };
  "step.failed": {
    readonly runId: string;
    readonly stepId: string;
    readonly error: GeneratorError;
  };
  "artifact.written": { readonly runId: string; readonly path: string };
  "cache.hit": { readonly key: string };
  "cache.miss": { readonly key: string };
  "import.completed": { readonly imported: number };
  "export.completed": { readonly exported: number };
}

export type { EventBus, EventHandler } from "@telemax/knowledge";

/** In-memory, typed generator event bus. */
export class GeneratorEventBus implements EventBus<GeneratorEvents> {
  private readonly handlers = new Map<keyof GeneratorEvents, Set<EventHandler<unknown>>>();

  public on<K extends keyof GeneratorEvents>(
    event: K,
    handler: EventHandler<GeneratorEvents[K]>,
  ): () => void {
    const set = this.handlers.get(event) ?? new Set<EventHandler<unknown>>();
    set.add(handler as EventHandler<unknown>);
    this.handlers.set(event, set);
    return (): void => {
      this.off(event, handler);
    };
  }

  public off<K extends keyof GeneratorEvents>(
    event: K,
    handler: EventHandler<GeneratorEvents[K]>,
  ): void {
    this.handlers.get(event)?.delete(handler as EventHandler<unknown>);
  }

  public emit<K extends keyof GeneratorEvents>(event: K, payload: GeneratorEvents[K]): void {
    const set = this.handlers.get(event);
    if (set === undefined) {
      return;
    }
    for (const handler of set) {
      handler(payload);
    }
  }
}

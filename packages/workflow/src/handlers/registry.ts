/** {@link StepHandlerRegistry} — registers task handlers by id. */
import type { StepHandler } from "../interfaces.js";

export class StepHandlerRegistry {
  private readonly handlers = new Map<string, StepHandler>();

  public register(id: string, handler: StepHandler): void {
    this.handlers.set(id, handler);
  }

  public get(id: string): StepHandler | undefined {
    return this.handlers.get(id);
  }

  public has(id: string): boolean {
    return this.handlers.has(id);
  }

  public list(): readonly string[] {
    return [...this.handlers.keys()];
  }
}

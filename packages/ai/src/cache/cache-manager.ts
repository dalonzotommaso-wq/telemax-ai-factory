/**
 * {@link InMemoryResponseCache} — a FIFO-bounded response cache implementing the
 * {@link ResponseCache} port. Replace via DI with a distributed cache later.
 */
import type { AIResponse } from "../domain/response.js";
import type { ResponseCache } from "../interfaces.js";

export class InMemoryResponseCache implements ResponseCache {
  private readonly store = new Map<string, AIResponse>();
  private readonly maxEntries: number;

  public constructor(maxEntries = 256) {
    this.maxEntries = Math.max(1, maxEntries);
  }

  public get(key: string): AIResponse | undefined {
    return this.store.get(key);
  }

  public set(key: string, value: AIResponse): void {
    if (!this.store.has(key) && this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
      }
    }
    this.store.set(key, value);
  }

  public clear(): void {
    this.store.clear();
  }
}

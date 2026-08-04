/** {@link InMemoryResultCache} — a FIFO-bounded generation-result cache. */
import type { GeneratorResult } from "./domain/result.js";
import type { GeneratorResultCache } from "./interfaces.js";

export class InMemoryResultCache implements GeneratorResultCache {
  private readonly store = new Map<string, GeneratorResult>();
  private readonly maxEntries: number;

  public constructor(maxEntries = 128) {
    this.maxEntries = Math.max(1, maxEntries);
  }

  public get(key: string): GeneratorResult | undefined {
    return this.store.get(key);
  }

  public set(key: string, value: GeneratorResult): void {
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

/**
 * {@link InMemoryRenderCache} — a small FIFO-bounded render cache implementing
 * the {@link RenderCache} port. Replace via DI with a distributed cache later.
 */
import type { RenderCache } from "../interfaces.js";

export class InMemoryRenderCache implements RenderCache {
  private readonly store = new Map<string, string>();
  private readonly maxEntries: number;

  public constructor(maxEntries = 256) {
    this.maxEntries = Math.max(1, maxEntries);
  }

  public get(key: string): string | undefined {
    return this.store.get(key);
  }

  public set(key: string, value: string): void {
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

/**
 * Metrics sinks. {@link NoopMetricsSink} is the default; {@link InMemoryMetricsSink}
 * records counters and observations for inspection and tests.
 */
import type { MetricsSink } from "../interfaces.js";

/** A metrics sink that discards everything. */
export class NoopMetricsSink implements MetricsSink {
  public increment(_name: string, _value?: number): void {
    // no-op
  }
  public observe(_name: string, _value: number): void {
    // no-op
  }
}

/** A metrics sink that keeps values in memory. */
export class InMemoryMetricsSink implements MetricsSink {
  private readonly counters = new Map<string, number>();
  private readonly observations = new Map<string, number[]>();

  public increment(name: string, value = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + value);
  }

  public observe(name: string, value: number): void {
    const list = this.observations.get(name) ?? [];
    list.push(value);
    this.observations.set(name, list);
  }

  public counter(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  public samples(name: string): readonly number[] {
    return this.observations.get(name) ?? [];
  }
}

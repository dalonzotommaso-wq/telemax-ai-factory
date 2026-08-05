/**
 * {@link DefaultHealthMonitor} — tracks consecutive failures per provider and
 * exposes a coarse {@link HealthState}.
 */
import type { HealthMonitor } from "../interfaces.js";
import type { HealthState, ProviderId } from "../types.js";

export class DefaultHealthMonitor implements HealthMonitor {
  private readonly failures = new Map<string, number>();
  private readonly states = new Map<string, HealthState>();

  public constructor(private readonly unavailableThreshold = 3) {}

  public report(providerId: ProviderId, healthy: boolean): void {
    if (healthy) {
      this.failures.set(providerId, 0);
      this.states.set(providerId, "healthy");
      return;
    }
    const count = (this.failures.get(providerId) ?? 0) + 1;
    this.failures.set(providerId, count);
    this.states.set(providerId, count >= this.unavailableThreshold ? "unavailable" : "degraded");
  }

  public state(providerId: ProviderId): HealthState {
    return this.states.get(providerId) ?? "healthy";
  }
}

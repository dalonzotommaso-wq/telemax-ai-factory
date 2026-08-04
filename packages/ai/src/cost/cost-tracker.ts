/**
 * Cost calculation and accumulation. {@link DefaultCostCalculator} derives cost
 * from usage and pricing; {@link CostTracker} accumulates spend per provider.
 */
import type { ModelPricing } from "../domain/model.js";
import type { TokenUsage } from "../domain/response.js";
import type { CostCalculator, CostSink } from "../interfaces.js";
import type { ModelId, ProviderId } from "../types.js";

export class DefaultCostCalculator implements CostCalculator {
  public cost(usage: TokenUsage, pricing: ModelPricing): number {
    return (
      (usage.promptTokens / 1000) * pricing.inputPer1kTokens +
      (usage.completionTokens / 1000) * pricing.outputPer1kTokens
    );
  }
}

export class CostTracker implements CostSink {
  private readonly perProvider = new Map<string, number>();
  private grandTotal = 0;

  public track(providerId: ProviderId, _modelId: ModelId, cost: number): void {
    this.perProvider.set(providerId, (this.perProvider.get(providerId) ?? 0) + cost);
    this.grandTotal += cost;
  }

  public total(): number {
    return this.grandTotal;
  }

  public byProvider(providerId: ProviderId): number {
    return this.perProvider.get(providerId) ?? 0;
  }
}

/** Model descriptor and pricing metadata. */
import type { ModelId, ProviderId } from "../types.js";
import type { ProviderCapabilities } from "./capabilities.js";

/** Per-1k-token pricing (currency-agnostic units). */
export interface ModelPricing {
  readonly inputPer1kTokens: number;
  readonly outputPer1kTokens: number;
}

/** A model registered against a provider. */
export interface ModelDescriptor {
  readonly id: ModelId;
  readonly providerId: ProviderId;
  readonly displayName: string;
  readonly capabilities: ProviderCapabilities;
  readonly contextWindow: number;
  readonly pricing: ModelPricing;
}

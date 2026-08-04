/**
 * Default selection strategies. {@link DefaultProviderSelector} and
 * {@link DefaultModelSelector} honor an explicit hint, then a configured
 * preference, then fall back to the first available entry.
 */
import { err, ok, type Result } from "@telemax/core";
import type { ModelDescriptor } from "../domain/model.js";
import { ProviderUnavailableError, type AIError } from "../errors.js";
import type { AIProvider, ModelSelector, ProviderSelector } from "../interfaces.js";
import type { ProviderId } from "../types.js";

export class DefaultProviderSelector implements ProviderSelector {
  public constructor(private readonly preferred?: string) {}

  public select(providers: readonly AIProvider[], hint?: string): Result<AIProvider, AIError> {
    if (providers.length === 0) {
      return err(new ProviderUnavailableError("No providers are registered."));
    }
    const wanted = hint ?? this.preferred;
    if (wanted !== undefined) {
      const match = providers.find((provider) => provider.id === wanted);
      return match === undefined
        ? err(new ProviderUnavailableError(`Provider "${wanted}" is not available.`))
        : ok(match);
    }
    const first = providers[0];
    return first === undefined
      ? err(new ProviderUnavailableError("No providers are registered."))
      : ok(first);
  }
}

export class DefaultModelSelector implements ModelSelector {
  public constructor(private readonly preferred?: string) {}

  public select(
    models: readonly ModelDescriptor[],
    providerId: ProviderId,
    hint?: string,
  ): Result<ModelDescriptor, AIError> {
    const forProvider = models.filter((model) => model.providerId === providerId);
    if (forProvider.length === 0) {
      return err(
        new ProviderUnavailableError(`No models registered for provider "${providerId}".`),
      );
    }
    const wanted = hint ?? this.preferred;
    if (wanted !== undefined) {
      const match = forProvider.find((model) => model.id === wanted);
      return match === undefined
        ? err(new ProviderUnavailableError(`Model "${wanted}" is not available.`))
        : ok(match);
    }
    const first = forProvider[0];
    return first === undefined
      ? err(new ProviderUnavailableError(`No models registered for provider "${providerId}".`))
      : ok(first);
  }
}

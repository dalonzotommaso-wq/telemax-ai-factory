/**
 * {@link AIProviderRegistry} — registers and resolves {@link AIProvider}
 * instances. Concrete providers are registered from outside this package.
 */
import { err, ok, type Result } from "@telemax/core";
import { RegistryLookupError, type AIError } from "../errors.js";
import type { AIProvider } from "../interfaces.js";
import type { ProviderId } from "../types.js";

export class AIProviderRegistry {
  private readonly providers = new Map<string, AIProvider>();

  public register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  public get(id: ProviderId): Result<AIProvider, AIError> {
    const found = this.providers.get(id);
    return found === undefined
      ? err(new RegistryLookupError(`Provider "${id}" is not registered.`))
      : ok(found);
  }

  public has(id: ProviderId): boolean {
    return this.providers.has(id);
  }

  public list(): readonly AIProvider[] {
    return [...this.providers.values()];
  }
}

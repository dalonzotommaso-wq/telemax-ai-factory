/**
 * {@link ModelRegistry} — registers and resolves {@link ModelDescriptor}s and
 * lists the models available for a provider.
 */
import { err, ok, type Result } from "@telemax/core";
import type { ModelDescriptor } from "../domain/model.js";
import { RegistryLookupError, type AIError } from "../errors.js";
import type { ModelId, ProviderId } from "../types.js";

export class ModelRegistry {
  private readonly models = new Map<string, ModelDescriptor>();

  public register(model: ModelDescriptor): void {
    this.models.set(model.id, model);
  }

  public get(id: ModelId): Result<ModelDescriptor, AIError> {
    const found = this.models.get(id);
    return found === undefined
      ? err(new RegistryLookupError(`Model "${id}" is not registered.`))
      : ok(found);
  }

  public list(): readonly ModelDescriptor[] {
    return [...this.models.values()];
  }

  public listByProvider(providerId: ProviderId): readonly ModelDescriptor[] {
    return [...this.models.values()].filter((model) => model.providerId === providerId);
  }
}

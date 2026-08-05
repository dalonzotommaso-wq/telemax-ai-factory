/** {@link GeneratorTransformRegistry} — registers transforms by id. */
import type { GeneratorTransform } from "../interfaces.js";

export class GeneratorTransformRegistry {
  private readonly transforms = new Map<string, GeneratorTransform>();

  public register(id: string, transform: GeneratorTransform): void {
    this.transforms.set(id, transform);
  }

  public get(id: string): GeneratorTransform | undefined {
    return this.transforms.get(id);
  }

  public has(id: string): boolean {
    return this.transforms.has(id);
  }

  public list(): readonly string[] {
    return [...this.transforms.keys()];
  }
}

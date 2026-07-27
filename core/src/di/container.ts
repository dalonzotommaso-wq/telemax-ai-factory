/**
 * A minimal, fully type-safe dependency-injection container.
 *
 * Services are registered against {@link Token}s, which carry the service's
 * type at compile time. Resolution is lazy and memoized (singleton per
 * container), which lets plugins share collaborators without the Core knowing
 * their concrete types — a key enabler of the plugin-first architecture.
 */
import { ContainerError } from "../errors/errors.js";

/**
 * A unique, type-carrying key for a service. Identity is by object reference,
 * so two tokens with the same description are still distinct.
 */
export interface Token<T> {
  readonly description: string;
  /** Phantom field preserving `T`. Never present at runtime. */
  readonly __type?: T;
}

/** A factory that lazily builds a service, possibly resolving its own deps. */
export type ServiceFactory<T> = (container: ServiceContainer) => T;

/** Create a new {@link Token} for a service of type `T`. */
export function createToken<T>(description: string): Token<T> {
  return { description };
}

/** Type-safe service container with lazy, memoized resolution. */
export class ServiceContainer {
  private readonly factories = new Map<Token<unknown>, ServiceFactory<unknown>>();
  private readonly instances = new Map<Token<unknown>, unknown>();

  /** Register (or overwrite) the factory for a token. */
  public register<T>(token: Token<T>, factory: ServiceFactory<T>): void {
    this.factories.set(token as Token<unknown>, factory as ServiceFactory<unknown>);
  }

  /** Whether a factory is registered for the given token. */
  public has(token: Token<unknown>): boolean {
    return this.factories.has(token);
  }

  /**
   * Resolve a service, building and caching it on first access.
   *
   * @throws {ContainerError} when no factory is registered for the token.
   */
  public resolve<T>(token: Token<T>): T {
    const key = token as Token<unknown>;
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }
    const factory = this.factories.get(key);
    if (factory === undefined) {
      throw new ContainerError(`No service registered for token "${token.description}".`);
    }
    const instance = factory(this);
    this.instances.set(key, instance);
    return instance as T;
  }
}

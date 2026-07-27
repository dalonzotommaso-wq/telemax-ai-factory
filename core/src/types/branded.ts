/**
 * Nominal ("branded") typing helpers.
 *
 * A branded type is structurally identical to its underlying primitive at
 * runtime but is treated as a distinct type at compile time. This prevents
 * accidental mixing of values that share a representation — for example two
 * different kinds of identifier that are both `string`.
 */

declare const brand: unique symbol;

/** The phantom marker that distinguishes one brand from another. */
export interface Brand<B extends string> {
  readonly [brand]: B;
}

/** `T` tagged with the compile-time brand `B`. */
export type Branded<T, B extends string> = T & Brand<B>;

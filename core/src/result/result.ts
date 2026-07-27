/**
 * A discriminated union representing either success (`Ok`) or failure (`Err`).
 *
 * The framework uses `Result` to model *expected* failures (validation,
 * lookups, parsing) explicitly in a function's type, reserving thrown errors
 * for programmer mistakes and truly exceptional conditions.
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/** The success branch of a {@link Result}. */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

/** The failure branch of a {@link Result}. */
export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

/** Construct a successful {@link Result}. */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/** Construct a failed {@link Result}. */
export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

/** Type guard narrowing a {@link Result} to its success branch. */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

/** Type guard narrowing a {@link Result} to its failure branch. */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

/** Transform the success value while passing any error through untouched. */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

/** Return the success value, or `fallback` when the result is an error. */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

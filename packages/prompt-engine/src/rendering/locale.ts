/**
 * {@link DefaultLocaleResolver} — resolves a requested locale against the
 * available ones (exact match, then language subtag, then fallback).
 */
import type { LocaleResolver } from "../interfaces.js";

export class DefaultLocaleResolver implements LocaleResolver {
  public resolve(available: readonly string[], requested: string, fallback: string): string {
    if (available.includes(requested)) {
      return requested;
    }
    const language = requested.split("-")[0] ?? requested;
    if (available.includes(language)) {
      return language;
    }
    return fallback;
  }
}

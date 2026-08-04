/** Declared provider/model capabilities (feature discovery). */
import type { Modality } from "../types.js";

export interface ProviderCapabilities {
  readonly streaming: boolean;
  readonly tools: boolean;
  readonly functionCalling: boolean;
  readonly vision: boolean;
  readonly jsonMode: boolean;
  readonly maxContextTokens: number;
  readonly modalities: readonly Modality[];
}

/** Conservative defaults: text-only, no advanced features. */
export const DEFAULT_CAPABILITIES: ProviderCapabilities = {
  streaming: false,
  tools: false,
  functionCalling: false,
  vision: false,
  jsonMode: false,
  maxContextTokens: 8192,
  modalities: ["text"],
};

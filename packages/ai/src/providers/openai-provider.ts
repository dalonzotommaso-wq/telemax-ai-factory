/**
 * {@link OpenAIProvider} — the first real {@link AIProvider}: an adapter over the
 * OpenAI Chat Completions HTTP API. It implements exactly the existing provider
 * port (no new abstraction) and uses the Node 22 global `fetch` (no SDK
 * dependency). Credentials are injected via config — never read here from the
 * environment, never logged. Resilience (retry/circuit-breaker/rate-limit) is
 * provided by the Orchestrator's execution pipeline, so this adapter only
 * performs a single call with a request timeout.
 */
import { err, ok, type Result } from "@telemax/core";
import { DEFAULT_CAPABILITIES, type ProviderCapabilities } from "../domain/capabilities.js";
import type { PreparedRequest } from "../domain/request.js";
import type { AIResponse } from "../domain/response.js";
import { ProviderExecutionError, type AIError } from "../errors.js";
import type { AIProvider } from "../interfaces.js";
import { asProviderId, type FinishReason, type ProviderId } from "../types.js";
import { systemClock, type Clock } from "../utils.js";

/** Default provider id. */
export const OPENAI_PROVIDER_ID = "openai";
/** Default OpenAI API base URL (no trailing slash). */
export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
/** Default model used when none is configured. */
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
/** Default per-request timeout. */
export const DEFAULT_OPENAI_TIMEOUT_MS = 30_000;

/**
 * Minimal transport contract — a structural subset of the global `fetch`, kept
 * small so unit tests can inject a mock without touching the network.
 */
export type FetchLike = (
  input: string,
  init: {
    readonly method: string;
    readonly headers: Record<string, string>;
    readonly body: string;
    readonly signal: AbortSignal;
  },
) => Promise<{
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

/** Construction config for {@link OpenAIProvider}. Secrets are injected, not read here. */
export interface OpenAIProviderConfig {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly organization?: string;
  readonly timeoutMs?: number;
  readonly id?: string;
  readonly capabilities?: ProviderCapabilities;
  readonly fetchImpl?: FetchLike;
  readonly clock?: Clock;
}

interface OpenAIChoice {
  readonly message?: { readonly content?: string };
  readonly finish_reason?: string;
}
interface OpenAICompletion {
  readonly choices?: readonly OpenAIChoice[];
  readonly usage?: {
    readonly prompt_tokens?: number;
    readonly completion_tokens?: number;
    readonly total_tokens?: number;
  };
}

function mapFinishReason(reason: string | undefined): FinishReason {
  switch (reason) {
    case "length":
      return "length";
    case "content_filter":
      return "content_filter";
    case "tool_calls":
    case "function_call":
      return "tool_calls";
    case "stop":
    case undefined:
    default:
      return "stop";
  }
}

export class OpenAIProvider implements AIProvider {
  public readonly id: ProviderId;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly organization: string | undefined;
  private readonly timeoutMs: number;
  private readonly caps: ProviderCapabilities;
  private readonly fetchImpl: FetchLike;
  private readonly clock: Clock;

  public constructor(config: OpenAIProviderConfig) {
    this.id = asProviderId(config.id ?? OPENAI_PROVIDER_ID);
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_OPENAI_BASE_URL).replace(/\/+$/, "");
    this.organization = config.organization;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_OPENAI_TIMEOUT_MS;
    this.caps = config.capabilities ?? DEFAULT_CAPABILITIES;
    this.fetchImpl = config.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
    this.clock = config.clock ?? systemClock;
  }

  public capabilities(): ProviderCapabilities {
    return this.caps;
  }

  public async complete(request: PreparedRequest): Promise<Result<AIResponse, AIError>> {
    if (this.apiKey.length === 0) {
      return err(
        new ProviderExecutionError(
          "OpenAI API key is not configured. Set OPENAI_API_KEY in the environment.",
        ),
      );
    }

    const body: Record<string, unknown> = {
      model: request.modelId,
      messages: request.messages.map((msg) => ({ role: msg.role, content: msg.content })),
    };
    if (request.params.temperature !== undefined) body["temperature"] = request.params.temperature;
    if (request.params.maxTokens !== undefined) body["max_tokens"] = request.params.maxTokens;
    if (request.params.topP !== undefined) body["top_p"] = request.params.topP;
    if (request.params.stop !== undefined) body["stop"] = [...request.params.stop];

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
    if (this.organization !== undefined) headers["OpenAI-Organization"] = this.organization;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") {
        return err(
          new ProviderExecutionError(
            `OpenAI request timed out after ${String(this.timeoutMs)}ms.`,
            {
              cause,
            },
          ),
        );
      }
      return err(
        new ProviderExecutionError(
          `OpenAI request failed: ${cause instanceof Error ? cause.message : String(cause)}`,
          cause instanceof Error ? { cause } : undefined,
        ),
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const detail = await this.errorDetail(response);
      return err(
        new ProviderExecutionError(
          `OpenAI request failed (HTTP ${String(response.status)}): ${detail}`,
        ),
      );
    }

    let payload: OpenAICompletion;
    try {
      payload = (await response.json()) as OpenAICompletion;
    } catch (cause) {
      return err(
        new ProviderExecutionError("OpenAI returned a response that is not valid JSON.", {
          cause: cause instanceof Error ? cause : new Error(String(cause)),
        }),
      );
    }

    const choice = payload.choices?.[0];
    const content = choice?.message?.content;
    if (typeof content !== "string") {
      return err(
        new ProviderExecutionError(
          "OpenAI returned a malformed response (missing choices[0].message.content).",
        ),
      );
    }

    const promptTokens = payload.usage?.prompt_tokens ?? 0;
    const completionTokens = payload.usage?.completion_tokens ?? 0;
    const totalTokens = payload.usage?.total_tokens ?? promptTokens + completionTokens;

    return ok({
      requestId: request.requestId,
      providerId: this.id,
      modelId: request.modelId,
      content,
      finishReason: mapFinishReason(choice?.finish_reason),
      usage: { promptTokens, completionTokens, totalTokens },
      cost: 0,
      createdAt: this.clock.now().toISOString(),
    });
  }

  /** Extract a human-readable error message from a non-2xx response, safely. */
  private async errorDetail(response: { text(): Promise<string> }): Promise<string> {
    let raw = "";
    try {
      raw = await response.text();
    } catch {
      return "no response body";
    }
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string } };
      if (typeof parsed.error?.message === "string") return parsed.error.message;
    } catch {
      /* not JSON — return the raw text */
    }
    return raw.length > 0 ? raw : "no response body";
  }
}

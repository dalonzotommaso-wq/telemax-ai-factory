/**
 * {@link StubProvider} — a local, deterministic {@link AIProvider} for tests and
 * development. It performs NO network I/O and uses NO credentials: it synthesizes
 * a reply from the request. Real providers replace it via the registry.
 */
import { ok, type Result } from "@telemax/core";
import { DEFAULT_CAPABILITIES, type ProviderCapabilities } from "../domain/capabilities.js";
import type { PreparedRequest } from "../domain/request.js";
import type { AIResponse, AIResponseChunk } from "../domain/response.js";
import { HeuristicTokenCounter } from "../cost/token-counter.js";
import type { AIError } from "../errors.js";
import type { AIProvider, TokenCounter } from "../interfaces.js";
import { asProviderId, type ProviderId } from "../types.js";
import { systemClock, type Clock } from "../utils.js";

/** Options for {@link StubProvider}. */
export interface StubProviderOptions {
  readonly id?: string;
  readonly capabilities?: ProviderCapabilities;
  readonly reply?: (request: PreparedRequest) => string;
  readonly clock?: Clock;
  readonly tokenCounter?: TokenCounter;
}

function defaultReply(request: PreparedRequest): string {
  const lastUser = [...request.messages].reverse().find((msg) => msg.role === "user");
  const seed = lastUser?.content ?? "";
  return `[stub:${request.modelId}] ${seed}`;
}

export class StubProvider implements AIProvider {
  public readonly id: ProviderId;
  private readonly caps: ProviderCapabilities;
  private readonly reply: (request: PreparedRequest) => string;
  private readonly clock: Clock;
  private readonly counter: TokenCounter;

  public constructor(options?: StubProviderOptions) {
    this.id = asProviderId(options?.id ?? "stub");
    this.caps = options?.capabilities ?? { ...DEFAULT_CAPABILITIES, streaming: true };
    this.reply = options?.reply ?? defaultReply;
    this.clock = options?.clock ?? systemClock;
    this.counter = options?.tokenCounter ?? new HeuristicTokenCounter();
  }

  public capabilities(): ProviderCapabilities {
    return this.caps;
  }

  public complete(request: PreparedRequest): Promise<Result<AIResponse, AIError>> {
    const content = this.reply(request);
    const promptTokens = this.counter.countMessages(request.messages);
    const completionTokens = this.counter.count(content);
    const response: AIResponse = {
      requestId: request.requestId,
      providerId: this.id,
      modelId: request.modelId,
      content,
      finishReason: "stop",
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      cost: 0,
      createdAt: this.clock.now().toISOString(),
    };
    return Promise.resolve(ok(response));
  }

  public async *stream(request: PreparedRequest): AsyncIterable<AIResponseChunk> {
    const result = await this.complete(request);
    yield {
      requestId: request.requestId,
      delta: result.ok ? result.value.content : "",
      done: true,
    };
  }
}

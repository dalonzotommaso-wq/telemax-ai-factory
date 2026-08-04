/**
 * {@link HeuristicTokenCounter} — a dependency-free token estimator (~4 chars per
 * token) implementing the {@link TokenCounter} port. Replace via DI with a real
 * tokenizer per provider later.
 */
import type { Message } from "../domain/message.js";
import type { TokenCounter } from "../interfaces.js";

export class HeuristicTokenCounter implements TokenCounter {
  public count(text: string): number {
    return text.length === 0 ? 0 : Math.ceil(text.length / 4);
  }

  public countMessages(messages: readonly Message[]): number {
    return messages.reduce((sum, msg) => sum + this.count(msg.content) + 2, 0);
  }
}

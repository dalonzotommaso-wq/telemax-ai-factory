/** Conversation aggregate: an ordered, immutable list of messages. */
import type { StructuredObject } from "@telemax/knowledge";
import type { Message } from "./message.js";

export interface Conversation {
  readonly id: string;
  readonly messages: readonly Message[];
  readonly metadata: StructuredObject;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Return a copy of `conversation` with `msg` appended. */
export function appendMessage(conversation: Conversation, msg: Message, now: string): Conversation {
  return {
    ...conversation,
    messages: [...conversation.messages, msg],
    updatedAt: now,
  };
}

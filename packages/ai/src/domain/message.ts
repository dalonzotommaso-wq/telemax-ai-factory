/** Conversation message value object. */
import type { StructuredObject } from "@telemax/knowledge";
import type { MessageRole } from "../types.js";

export interface Message {
  readonly role: MessageRole;
  readonly content: string;
  readonly name?: string;
  readonly metadata?: StructuredObject;
}

/** Build a {@link Message}, omitting optional fields when absent. */
export function message(
  role: MessageRole,
  content: string,
  extra?: { readonly name?: string; readonly metadata?: StructuredObject },
): Message {
  return {
    role,
    content,
    ...(extra?.name !== undefined ? { name: extra.name } : {}),
    ...(extra?.metadata !== undefined ? { metadata: extra.metadata } : {}),
  };
}

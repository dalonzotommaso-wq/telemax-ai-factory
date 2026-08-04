/**
 * {@link ConversationManager} — an in-memory store of {@link Conversation}
 * aggregates with append semantics. Replace via DI with a persistent store later.
 */
import { err, ok, type Result } from "@telemax/core";
import type { StructuredObject } from "@telemax/knowledge";
import { appendMessage, type Conversation } from "../domain/conversation.js";
import type { Message } from "../domain/message.js";
import { RegistryLookupError, type AIError } from "../errors.js";
import { systemClock, uuidIdGenerator, type Clock, type IdGenerator } from "../utils.js";

export class ConversationManager {
  private readonly store = new Map<string, Conversation>();

  public constructor(
    private readonly clock: Clock = systemClock,
    private readonly ids: IdGenerator = uuidIdGenerator,
  ) {}

  public create(metadata: StructuredObject = {}): Conversation {
    const now = this.clock.now().toISOString();
    const conversation: Conversation = {
      id: this.ids.next(),
      messages: [],
      metadata,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(conversation.id, conversation);
    return conversation;
  }

  public get(id: string): Result<Conversation, AIError> {
    const found = this.store.get(id);
    return found === undefined
      ? err(new RegistryLookupError(`Conversation "${id}" not found.`))
      : ok(found);
  }

  public append(id: string, msg: Message): Result<Conversation, AIError> {
    const found = this.store.get(id);
    if (found === undefined) {
      return err(new RegistryLookupError(`Conversation "${id}" not found.`));
    }
    const updated = appendMessage(found, msg, this.clock.now().toISOString());
    this.store.set(id, updated);
    return ok(updated);
  }

  public list(): readonly Conversation[] {
    return [...this.store.values()];
  }
}

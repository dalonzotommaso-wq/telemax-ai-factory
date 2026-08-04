import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { ConversationManager } from "./conversation-manager.js";
import { message } from "../domain/message.js";
import type { Clock, IdGenerator } from "../utils.js";

const clock: Clock = { now: () => new Date("2026-01-01T00:00:00.000Z") };

function ids(): IdGenerator {
  let n = 0;
  return {
    next: () => {
      n += 1;
      return `c${String(n)}`;
    },
  };
}

describe("ConversationManager", () => {
  it("creates, appends and lists conversations", () => {
    const manager = new ConversationManager(clock, ids());
    const conversation = manager.create({});
    expect(conversation.id).toBe("c1");
    const appended = manager.append(conversation.id, message("user", "hi"));
    if (isErr(appended)) {
      throw appended.error;
    }
    expect(appended.value.messages).toHaveLength(1);
    expect(manager.list()).toHaveLength(1);
    expect(isOk(manager.get(conversation.id))).toBe(true);
  });

  it("errors on unknown conversation", () => {
    expect(isErr(new ConversationManager(clock, ids()).get("nope"))).toBe(true);
  });
});

/**
 * {@link PromptPipeline} — builds the final message list for a request. It
 * prepends a system message from the assembled {@link Context} and, when a
 * template id and a Prompt Engine are provided, renders the template into a
 * message; otherwise it uses the caller's base messages.
 */
import { err, isErr, ok, type Result } from "@telemax/core";
import type { StructuredValue } from "@telemax/knowledge";
import type { PromptEngine } from "@telemax/prompt-engine";
import type { Context } from "../domain/context.js";
import { message, type Message } from "../domain/message.js";
import { InvalidRequestError, type AIError } from "../errors.js";

/** Input to {@link PromptPipeline.build}. */
export interface PromptBuildInput {
  readonly context: Context;
  readonly baseMessages: readonly Message[];
  readonly templateId?: string;
  readonly variables?: Readonly<Record<string, StructuredValue>>;
  readonly locale?: string;
}

export class PromptPipeline {
  public constructor(private readonly prompt?: PromptEngine) {}

  public async build(input: PromptBuildInput): Promise<Result<readonly Message[], AIError>> {
    const messages: Message[] = [];
    if (input.context.system !== undefined) {
      messages.push(message("system", input.context.system));
    }

    if (input.templateId !== undefined && this.prompt !== undefined) {
      const variables: Readonly<Record<string, StructuredValue>> = {
        ...input.context.variables,
        ...(input.variables ?? {}),
      };
      const rendered = await this.prompt.render({
        templateId: input.templateId,
        variables,
        ...(input.locale !== undefined ? { locale: input.locale } : {}),
      });
      if (isErr(rendered)) {
        return err(
          new InvalidRequestError("Prompt rendering failed.", [rendered.error.message], {
            cause: rendered.error,
          }),
        );
      }
      messages.push(message(rendered.value.role, rendered.value.content));
    } else {
      messages.push(...input.baseMessages);
    }

    if (messages.length === 0) {
      return err(new InvalidRequestError("No messages to send.", ["empty prompt"]));
    }
    return ok(messages);
  }
}

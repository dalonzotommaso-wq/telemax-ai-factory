/**
 * {@link DefaultPromptFormatter} — serializes a {@link RenderedPrompt}.
 *
 * `text` and `markdown` are implemented; `xml` and `json` are prepared
 * (structured output) and return a {@link PromptNotImplementedError}.
 */
import { err, ok, type Result } from "@telemax/core";
import { PromptNotImplementedError, type PromptError } from "../errors.js";
import type { RenderedPrompt } from "../domain/message.js";
import type { PromptFormatter } from "../interfaces.js";
import type { PromptFormat } from "../types.js";

export class DefaultPromptFormatter implements PromptFormatter {
  public format(rendered: RenderedPrompt, format: PromptFormat): Result<string, PromptError> {
    switch (format) {
      case "text":
        return ok(
          rendered.messages.map((message) => `[${message.role}]\n${message.content}`).join("\n\n"),
        );
      case "markdown":
        return ok(
          rendered.messages
            .map((message) => `## ${capitalize(message.role)}\n\n${message.content}`)
            .join("\n\n"),
        );
      case "xml":
        return err(
          new PromptNotImplementedError("XML output is prepared but not yet implemented."),
        );
      case "json":
        return err(
          new PromptNotImplementedError(
            "JSON structured output is prepared but not yet implemented.",
          ),
        );
      default:
        return err(new PromptNotImplementedError(`Unsupported format: ${String(format)}.`));
    }
  }
}

function capitalize(value: string): string {
  return value.length === 0 ? value : `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

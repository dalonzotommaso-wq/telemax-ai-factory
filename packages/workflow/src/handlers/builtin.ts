/** Built-in task handlers: `noop` (returns null) and `echo` (returns its input). */
import { ok } from "@telemax/core";
import type { StepHandler } from "../interfaces.js";
import type { StepHandlerRegistry } from "./registry.js";

export const noopHandler: StepHandler = () => Promise.resolve(ok(null));

export const echoHandler: StepHandler = (input) => Promise.resolve(ok(input));

/** Register the built-in handlers into a registry. */
export function registerBuiltinHandlers(registry: StepHandlerRegistry): void {
  registry.register("noop", noopHandler);
  registry.register("echo", echoHandler);
}

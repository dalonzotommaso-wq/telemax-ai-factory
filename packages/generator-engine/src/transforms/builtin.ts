/** Built-in transforms: `identity` (returns input) and `json` (stringifies input). */
import { ok } from "@telemax/core";
import type { GeneratorTransform } from "../interfaces.js";
import type { GeneratorTransformRegistry } from "./registry.js";

export const identityTransform: GeneratorTransform = (input) => Promise.resolve(ok(input));

export const jsonTransform: GeneratorTransform = (input) =>
  Promise.resolve(ok(JSON.stringify(input)));

/** Register the built-in transforms into a registry. */
export function registerBuiltinTransforms(registry: GeneratorTransformRegistry): void {
  registry.register("identity", identityTransform);
  registry.register("json", jsonTransform);
}

/**
 * Template inheritance resolution.
 *
 * A child template may `extends` a parent and override named blocks
 * (`{{#block name}}…{{/block}}`). {@link resolveInheritance} walks the chain to
 * the root, merges block overrides (most-derived wins) and produces the final
 * body string (block markers flattened) ready for the renderer. Nested blocks
 * are not supported.
 */
import { err, ok, type Result } from "@telemax/core";
import { PromptResolutionError, type PromptError } from "../errors.js";
import type { PromptTemplate } from "../domain/template.js";
import type { TemplateId } from "../types.js";

const BLOCK_PATTERN = /\{\{#block\s+([\w.-]+)\s*\}\}([\s\S]*?)\{\{\/block\}\}/g;

interface ParsedBlocks {
  readonly skeleton: string;
  readonly blocks: ReadonlyMap<string, string>;
}

function parseBlocks(body: string): ParsedBlocks {
  const blocks = new Map<string, string>();
  const skeleton = body.replace(BLOCK_PATTERN, (_match, name: string, inner: string) => {
    blocks.set(name, inner);
    return `\uE000${name}\uE000`;
  });
  return { skeleton, blocks };
}

/**
 * Resolve `template` into its final body for `locale`, merging inherited blocks.
 * `getTemplate` supplies parents already loaded (synchronously) by the caller.
 */
export function resolveInheritance(
  template: PromptTemplate,
  getTemplate: (id: TemplateId) => PromptTemplate | undefined,
  locale: string,
): Result<string, PromptError> {
  const chain: PromptTemplate[] = [];
  const seen = new Set<string>();
  let current: PromptTemplate | undefined = template;
  while (current !== undefined) {
    if (seen.has(current.id)) {
      return err(new PromptResolutionError(`Inheritance cycle detected at "${current.id}".`));
    }
    seen.add(current.id);
    chain.push(current);
    if (current.extendsId === undefined) {
      break;
    }
    const parent: PromptTemplate | undefined = getTemplate(current.extendsId);
    if (parent === undefined) {
      return err(new PromptResolutionError(`Parent template "${current.extendsId}" not found.`));
    }
    current = parent;
  }

  // chain is [leaf, …, root]; if no inheritance, just return the body.
  const root = chain[chain.length - 1];
  if (root === undefined) {
    return ok(template.bodyFor(locale));
  }
  const rootParsed = parseBlocks(root.bodyFor(locale));

  const finalBlocks = new Map<string, string>(rootParsed.blocks);
  // Apply overrides from the child just below root down to the leaf.
  for (let i = chain.length - 2; i >= 0; i -= 1) {
    const descendant = chain[i];
    if (descendant === undefined) {
      continue;
    }
    const parsed = parseBlocks(descendant.bodyFor(locale));
    for (const [name, content] of parsed.blocks) {
      finalBlocks.set(name, content);
    }
  }

  const filled = rootParsed.skeleton.replace(/\uE000([\w.-]+)\uE000/g, (_match, name: string) => {
    return finalBlocks.get(name) ?? "";
  });
  return ok(filled);
}

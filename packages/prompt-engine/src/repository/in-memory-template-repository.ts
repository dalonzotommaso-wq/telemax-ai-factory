/**
 * {@link InMemoryTemplateRepository} — process-local implementation of the
 * {@link TemplateRepository} port with per-template version history.
 */
import { err, ok, type Result } from "@telemax/core";
import { versionOf, type PromptVersion } from "../domain/version.js";
import { PromptNotFoundError, type PromptError } from "../errors.js";
import type { PromptTemplate } from "../domain/template.js";
import type { TemplateRepository } from "../interfaces.js";
import type { TemplateFilter, TemplateId } from "../types.js";
import { systemClock, type Clock } from "../utils.js";

/** Options for {@link InMemoryTemplateRepository}. */
export interface TemplateRepositoryOptions {
  readonly enableVersioning?: boolean;
  readonly clock?: Clock;
}

export class InMemoryTemplateRepository implements TemplateRepository {
  private readonly templates = new Map<string, PromptTemplate>();
  private readonly history = new Map<string, PromptVersion[]>();
  private readonly enableVersioning: boolean;
  private readonly clock: Clock;

  public constructor(options?: TemplateRepositoryOptions) {
    this.enableVersioning = options?.enableVersioning ?? true;
    this.clock = options?.clock ?? systemClock;
  }

  public save(template: PromptTemplate): Promise<Result<PromptTemplate, PromptError>> {
    if (this.enableVersioning) {
      const snapshots = this.history.get(template.id) ?? [];
      snapshots.push(versionOf(template, this.clock.now().toISOString()));
      this.history.set(template.id, snapshots);
    }
    this.templates.set(template.id, template);
    return Promise.resolve(ok(template));
  }

  public get(id: TemplateId): Promise<Result<PromptTemplate, PromptError>> {
    const found = this.templates.get(id);
    if (found === undefined) {
      return Promise.resolve(err(new PromptNotFoundError(`Template "${id}" not found.`)));
    }
    return Promise.resolve(ok(found));
  }

  public has(id: TemplateId): Promise<boolean> {
    return Promise.resolve(this.templates.has(id));
  }

  public remove(id: TemplateId): Promise<Result<void, PromptError>> {
    if (!this.templates.has(id)) {
      return Promise.resolve(err(new PromptNotFoundError(`Template "${id}" not found.`)));
    }
    this.templates.delete(id);
    this.history.delete(id);
    return Promise.resolve(ok(undefined));
  }

  public list(filter?: TemplateFilter): Promise<Result<readonly PromptTemplate[], PromptError>> {
    const all = [...this.templates.values()];
    const filtered =
      filter === undefined ? all : all.filter((template) => matches(template, filter));
    return Promise.resolve(ok(filtered));
  }

  public versions(id: TemplateId): Promise<Result<readonly PromptVersion[], PromptError>> {
    return Promise.resolve(ok(this.history.get(id) ?? []));
  }
}

function matches(template: PromptTemplate, filter: TemplateFilter): boolean {
  if (filter.format !== undefined && template.format !== filter.format) {
    return false;
  }
  if (filter.role !== undefined && template.role !== filter.role) {
    return false;
  }
  if (filter.categories !== undefined && !hasAny(template.metadata.categories, filter.categories)) {
    return false;
  }
  if (filter.tags !== undefined && !hasAny(template.metadata.tags, filter.tags)) {
    return false;
  }
  return true;
}

function hasAny(values: readonly string[], wanted: readonly string[]): boolean {
  if (wanted.length === 0) {
    return true;
  }
  const set = new Set(values);
  return wanted.some((entry) => set.has(entry));
}

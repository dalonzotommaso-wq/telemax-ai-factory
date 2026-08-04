/**
 * {@link KnowledgeCategory} — an immutable, normalized category value object.
 * Categories may form a shallow hierarchy via an optional parent slug.
 */
import { slugify } from "../utils.js";

/** A normalized knowledge category. */
export class KnowledgeCategory {
  public readonly name: string;
  public readonly slug: string;
  public readonly parent?: string;

  private constructor(name: string, slug: string, parent?: string) {
    this.name = name;
    this.slug = slug;
    if (parent !== undefined) {
      this.parent = parent;
    }
  }

  /** Create a category from a display name and optional parent name. */
  public static of(name: string, parent?: string): KnowledgeCategory {
    const parentSlug = parent !== undefined ? slugify(parent) : "";
    return parentSlug.length > 0
      ? new KnowledgeCategory(name, slugify(name), parentSlug)
      : new KnowledgeCategory(name, slugify(name));
  }

  /** Structural equality by slug (and parent slug). */
  public equals(other: KnowledgeCategory): boolean {
    return this.slug === other.slug && this.parent === other.parent;
  }
}

/**
 * {@link KnowledgeTag} — an immutable, normalized tag value object.
 */
import { slugify } from "../utils.js";

/** A normalized knowledge tag. */
export class KnowledgeTag {
  public readonly name: string;
  public readonly slug: string;

  private constructor(name: string, slug: string) {
    this.name = name;
    this.slug = slug;
  }

  /** Create a tag from a display name. */
  public static of(name: string): KnowledgeTag {
    return new KnowledgeTag(name, slugify(name));
  }

  /** Structural equality by slug. */
  public equals(other: KnowledgeTag): boolean {
    return this.slug === other.slug;
  }
}

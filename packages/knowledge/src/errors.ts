/**
 * Knowledge-engine error hierarchy.
 *
 * All errors extend the Core {@link FrameworkError}, inheriting a stable
 * machine-readable `code` and standard `cause` chaining. Expected failures are
 * returned via the Core `Result` type; these errors are the `E` channel.
 */
import { FrameworkError, type FrameworkErrorOptions } from "@telemax/core";

/** Raised when a document fails validation. Carries the list of issues. */
export class KnowledgeValidationError extends FrameworkError {
  public readonly code = "ERR_KNOWLEDGE_VALIDATION";
  public readonly issues: readonly string[];

  public constructor(message: string, issues: readonly string[], options?: FrameworkErrorOptions) {
    super(message, options);
    this.issues = issues;
  }
}

/** Raised when a requested document (or version) does not exist. */
export class KnowledgeNotFoundError extends FrameworkError {
  public readonly code = "ERR_KNOWLEDGE_NOT_FOUND";
}

/** Raised when attempting to create a document that already exists. */
export class KnowledgeDuplicateError extends FrameworkError {
  public readonly code = "ERR_KNOWLEDGE_DUPLICATE";
}

/** Raised when no loader/handler supports a given content format. */
export class UnsupportedFormatError extends FrameworkError {
  public readonly code = "ERR_KNOWLEDGE_UNSUPPORTED_FORMAT";
}

/** Raised when content cannot be parsed (invalid JSON/YAML, …). */
export class KnowledgeParseError extends FrameworkError {
  public readonly code = "ERR_KNOWLEDGE_PARSE";
}

/** Raised by prepared-but-unimplemented capabilities (pdf/image, embeddings). */
export class NotImplementedError extends FrameworkError {
  public readonly code = "ERR_KNOWLEDGE_NOT_IMPLEMENTED";
}

/** Raised for import/export or source I/O problems. */
export class KnowledgeIoError extends FrameworkError {
  public readonly code = "ERR_KNOWLEDGE_IO";
}

/** Union of all knowledge errors — used as the `E` in `Result<T, KnowledgeError>`. */
export type KnowledgeError =
  | KnowledgeValidationError
  | KnowledgeNotFoundError
  | KnowledgeDuplicateError
  | UnsupportedFormatError
  | KnowledgeParseError
  | NotImplementedError
  | KnowledgeIoError;

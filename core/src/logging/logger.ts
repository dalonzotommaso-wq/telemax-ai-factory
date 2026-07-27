/**
 * Structured logging abstraction.
 *
 * The Core depends only on the {@link Logger} interface; a concrete
 * implementation is injected at the edges. A minimal {@link ConsoleLogger} is
 * provided so the framework is usable out of the box without pulling in a
 * logging dependency.
 */

/** Severity levels, ordered from most to least verbose. */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** Arbitrary structured context attached to a log record. */
export type LogFields = Readonly<Record<string, unknown>>;

/** The logging contract consumed throughout the framework. */
export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  /** Derive a child logger that always includes the given `bindings`. */
  child(bindings: LogFields): Logger;
}

/** Construction options for {@link ConsoleLogger}. */
export interface ConsoleLoggerOptions {
  /** Minimum level to emit. Defaults to `"info"`. */
  readonly level?: LogLevel;
  /** Fields merged into every record produced by this logger. */
  readonly bindings?: LogFields;
  /** Output sink for the serialized line. Defaults to stdout. */
  readonly sink?: (line: string) => void;
}

/** Numeric weight used to compare {@link LogLevel} values. */
const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/**
 * A dependency-free {@link Logger} that emits one JSON object per line. It is
 * intentionally simple; production deployments are expected to inject a richer
 * implementation (pino, winston, …) behind the same interface.
 */
export class ConsoleLogger implements Logger {
  private readonly level: LogLevel;
  private readonly bindings: LogFields;
  private readonly sink: (line: string) => void;

  public constructor(options?: ConsoleLoggerOptions) {
    this.level = options?.level ?? "info";
    this.bindings = options?.bindings ?? {};
    this.sink =
      options?.sink ??
      ((line: string): void => {
        process.stdout.write(`${line}\n`);
      });
  }

  public debug(message: string, fields?: LogFields): void {
    this.write("debug", message, fields);
  }

  public info(message: string, fields?: LogFields): void {
    this.write("info", message, fields);
  }

  public warn(message: string, fields?: LogFields): void {
    this.write("warn", message, fields);
  }

  public error(message: string, fields?: LogFields): void {
    this.write("error", message, fields);
  }

  public child(bindings: LogFields): Logger {
    return new ConsoleLogger({
      level: this.level,
      bindings: { ...this.bindings, ...bindings },
      sink: this.sink,
    });
  }

  /** Serialize and emit a record if it meets the configured level. */
  private write(level: LogLevel, message: string, fields?: LogFields): void {
    if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[this.level]) {
      return;
    }
    const record: LogFields = {
      level,
      time: new Date().toISOString(),
      message,
      ...this.bindings,
      ...(fields ?? {}),
    };
    this.sink(JSON.stringify(record));
  }
}

import { describe, expect, it } from "vitest";
import { ConsoleLogger } from "./logger.js";

function capture(): { readonly lines: string[]; readonly sink: (line: string) => void } {
  const lines: string[] = [];
  return { lines, sink: (line: string): void => void lines.push(line) };
}

describe("ConsoleLogger", () => {
  it("emits one JSON record per call with level, time and message", () => {
    const { lines, sink } = capture();
    new ConsoleLogger({ sink }).info("hello", { user: "ada" });
    expect(lines).toHaveLength(1);
    const record = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
    expect(record["level"]).toBe("info");
    expect(record["message"]).toBe("hello");
    expect(record["user"]).toBe("ada");
    expect(typeof record["time"]).toBe("string");
  });

  it("suppresses records below the configured level", () => {
    const { lines, sink } = capture();
    const logger = new ConsoleLogger({ level: "warn", sink });
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");
    const levels = lines.map((line) => (JSON.parse(line) as { level: string }).level);
    expect(levels).toEqual(["warn", "error"]);
  });

  it("suppresses debug at the default (info) level", () => {
    const { lines, sink } = capture();
    const logger = new ConsoleLogger({ sink });
    logger.debug("nope");
    expect(lines).toHaveLength(0);
  });

  it("merges parent bindings, child bindings and call fields", () => {
    const { lines, sink } = capture();
    const base = new ConsoleLogger({ sink, bindings: { service: "core" } });
    base.child({ scope: "test" }).warn("m", { extra: 1 });
    const record = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
    expect(record["service"]).toBe("core");
    expect(record["scope"]).toBe("test");
    expect(record["extra"]).toBe(1);
    expect(record["level"]).toBe("warn");
  });
});

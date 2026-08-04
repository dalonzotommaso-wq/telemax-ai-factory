import { isErr, isOk, ok, type Result } from "@telemax/core";
import { ServiceContainer } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { BaseGenerator } from "./base-generator.js";
import type { GenerationRequest, GenerationResult } from "./generator.js";
import type { Logger, Plugin } from "@telemax/core";

class TestGenerator extends BaseGenerator {
  public readonly name = "test-generator";
  protected readonly kinds = ["site", "page"];
  protected run(request: GenerationRequest): Promise<Result<GenerationResult, Error>> {
    return Promise.resolve(
      ok({ artifacts: [{ path: `${request.kind}.txt`, contents: "generated" }] }),
    );
  }
}

describe("BaseGenerator", () => {
  it("reports supported kinds", () => {
    const generator = new TestGenerator();
    expect(generator.supports("site")).toBe(true);
    expect(generator.supports("unknown")).toBe(false);
  });

  it("defaults the version to 0.1.0", () => {
    expect(new TestGenerator().version).toBe("0.1.0");
  });

  it("rejects an unsupported kind without calling run", async () => {
    const result = await new TestGenerator().generate({ kind: "unknown", input: {} });
    expect(isErr(result)).toBe(true);
  });

  it("delegates a supported kind to run", async () => {
    const result = await new TestGenerator().generate({ kind: "site", input: {} });
    if (isErr(result)) {
      throw result.error;
    }
    expect(isOk(result)).toBe(true);
    expect(result.value.artifacts[0]?.path).toBe("site.txt");
  });

  it("implements the plugin setup hook", () => {
    const generator = new TestGenerator();
    const logger: Logger = {
      debug: (): void => undefined,
      info: (): void => undefined,
      warn: (): void => undefined,
      error: (): void => undefined,
      child: (): Logger => logger,
    };
    const plugin: Plugin = generator;
    expect(() => plugin.setup({ logger, services: new ServiceContainer() })).not.toThrow();
  });
});

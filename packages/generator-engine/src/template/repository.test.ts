import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { GeneratorTemplateRepository } from "./repository.js";

describe("GeneratorTemplateRepository", () => {
  it("registers, resolves and lists templates", () => {
    const repo = new GeneratorTemplateRepository();
    repo.register({ id: "tpl", name: "tpl", body: "hello" });
    expect(repo.has("tpl")).toBe(true);
    expect(isOk(repo.get("tpl"))).toBe(true);
    expect(repo.list()).toHaveLength(1);
  });

  it("fails to resolve an unknown template", () => {
    expect(isErr(new GeneratorTemplateRepository().get("ghost"))).toBe(true);
  });
});

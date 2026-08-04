import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { InMemoryTemplateRepository } from "./in-memory-template-repository.js";
import { PromptTemplate } from "../domain/template.js";
import { createPromptMetadata } from "../domain/metadata.js";
import { asTemplateId } from "../types.js";
import type { PromptFormat, PromptRole } from "../types.js";

const meta = createPromptMetadata({ tags: ["greeting"] }, "2026-01-01T00:00:00.000Z", "en");

function make(id: string, format: PromptFormat = "text", role?: PromptRole): PromptTemplate {
  return PromptTemplate.create({
    id: asTemplateId(id),
    name: id,
    body: "b",
    format,
    variables: [],
    metadata: meta,
    ...(role !== undefined ? { role } : {}),
  });
}

describe("InMemoryTemplateRepository", () => {
  it("saves, gets, checks and removes templates", async () => {
    const repo = new InMemoryTemplateRepository();
    await repo.save(make("a"));
    expect(isOk(await repo.get(asTemplateId("a")))).toBe(true);
    expect(await repo.has(asTemplateId("a"))).toBe(true);
    await repo.remove(asTemplateId("a"));
    expect(isErr(await repo.get(asTemplateId("a")))).toBe(true);
  });

  it("records version history when versioning is enabled", async () => {
    const repo = new InMemoryTemplateRepository({ enableVersioning: true });
    const first = make("a");
    await repo.save(first);
    await repo.save(first.withVersion(2, meta));
    const versions = await repo.versions(asTemplateId("a"));
    if (isErr(versions)) {
      throw versions.error;
    }
    expect(versions.value).toHaveLength(2);
  });

  it("filters by format, role and tags", async () => {
    const repo = new InMemoryTemplateRepository();
    await repo.save(make("t1", "text", "system"));
    await repo.save(make("t2", "markdown", "user"));
    const byFormat = await repo.list({ format: "markdown" });
    const byRole = await repo.list({ role: "system" });
    const byTag = await repo.list({ tags: ["greeting"] });
    if (isErr(byFormat) || isErr(byRole) || isErr(byTag)) {
      throw new Error("list failed");
    }
    expect(byFormat.value).toHaveLength(1);
    expect(byRole.value).toHaveLength(1);
    expect(byTag.value).toHaveLength(2);
  });
});

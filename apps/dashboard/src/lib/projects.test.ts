import { describe, expect, it } from "vitest";
import { canAdvance, filterAndSortProjects, wizardToInput, INITIAL_WIZARD } from "./projects";
import type { Project } from "./api";

function project(over: Partial<Project>): Project {
  return {
    id: 1,
    uuid: "u",
    slug: "sample",
    name: "Sample",
    description: "",
    client: "",
    category: "",
    type: "react",
    stack: "",
    generator: "",
    workflow: "",
    knowledgePack: "",
    aiProvider: "",
    version: "0.1.0",
    status: "draft",
    workspace: "workspace/sample",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

describe("filterAndSortProjects", () => {
  const items = [
    project({ id: 1, name: "Beta", description: "sports" }),
    project({ id: 2, name: "Alpha", description: "news" }),
    project({ id: 3, name: "Gamma", description: "magazine" }),
  ];

  it("filters by name or description (case-insensitive)", () => {
    expect(filterAndSortProjects(items, "alph", "name", "asc")).toHaveLength(1);
    expect(filterAndSortProjects(items, "NEWS", "name", "asc")[0]?.name).toBe("Alpha");
  });

  it("sorts ascending and descending by name", () => {
    expect(filterAndSortProjects(items, "", "name", "asc").map((p) => p.name)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
    expect(filterAndSortProjects(items, "", "name", "desc").map((p) => p.name)).toEqual([
      "Gamma",
      "Beta",
      "Alpha",
    ]);
  });

  it("returns all when query is empty", () => {
    expect(filterAndSortProjects(items, "  ", "name", "asc")).toHaveLength(3);
  });
});

describe("wizard logic", () => {
  it("blocks step 1 until a name is entered", () => {
    expect(canAdvance(INITIAL_WIZARD)).toBe(false);
    expect(canAdvance({ ...INITIAL_WIZARD, name: "X" })).toBe(true);
  });

  it("blocks step 2 until a valid type is chosen", () => {
    expect(canAdvance({ ...INITIAL_WIZARD, step: 2, name: "X" })).toBe(false);
    expect(canAdvance({ ...INITIAL_WIZARD, step: 2, name: "X", type: "flutter" })).toBe(true);
  });

  it("builds a create input from wizard state", () => {
    const input = wizardToInput({
      step: 6,
      name: "  TGMAX  ",
      client: " Gruppo AIR ",
      description: " hi ",
      type: "wordpress-news",
      generator: "@telemax/generator-wordpress",
      knowledgePack: "@telemax/knowledge",
      aiProvider: "stub",
    });
    expect(input).toEqual({
      name: "TGMAX",
      type: "wordpress-news",
      description: "hi",
      client: "Gruppo AIR",
      generator: "@telemax/generator-wordpress",
      knowledgePack: "@telemax/knowledge",
      aiProvider: "stub",
    });
  });

  it("throws if type is missing", () => {
    expect(() => wizardToInput({ ...INITIAL_WIZARD, step: 4 })).toThrow();
  });
});

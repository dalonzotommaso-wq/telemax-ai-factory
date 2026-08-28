import { describe, expect, it } from "vitest";
import type { Project } from "../../domain.js";
import { resolveAdapter } from "./registry.js";
import type { ProjectManifest } from "./adapter.js";

function project(overrides: Partial<Project>): Project {
  return {
    id: 1,
    uuid: "u",
    slug: "demo",
    name: "Demo",
    description: "",
    client: "",
    category: "",
    type: "wordpress-news",
    stack: "",
    generator: "",
    workflow: "",
    knowledgePack: "",
    aiProvider: "",
    version: "0.1.0",
    status: "draft",
    workspace: "",
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("resolveAdapter", () => {
  it("routes a wordpress-news project to the wordpress adapter", () => {
    expect(resolveAdapter(project({ type: "wordpress-news" }), {}).id).toBe("wordpress-news");
  });

  it("routes a landing-page project to the landing adapter", () => {
    expect(resolveAdapter(project({ type: "landing-page" }), {}).id).toBe("landing-page");
  });

  it("routes by installed generator id from the manifest", () => {
    const manifest: ProjectManifest = { generator: "@telemax/generator-landing" };
    expect(resolveAdapter(project({ type: "react" }), manifest).id).toBe("landing-page");
  });

  it('throws "No runnable generator" for an unsupported type', () => {
    expect(() => resolveAdapter(project({ type: "flutter" }), {})).toThrow(/No runnable generator/);
  });
});

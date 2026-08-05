import { describe, expect, it } from "vitest";
import { buildProjectBlueprint, blueprintDoc } from "./project.js";
import { resolveWordPressConfig } from "../config.js";

describe("project blueprint", () => {
  it("represents the whole project with a resolvable dependency graph", () => {
    const blueprint = buildProjectBlueprint(resolveWordPressConfig({ siteName: "N" }));
    expect(blueprint.target).toBe("wordpress");
    expect(blueprint.directories.length).toBeGreaterThan(8);
    expect(blueprint.components).toHaveLength(13);
    const paths = new Set(blueprint.artifacts.map((node) => node.path));
    for (const node of blueprint.artifacts) {
      for (const dependency of node.dependsOn) {
        expect(paths.has(dependency)).toBe(true);
      }
    }
    const single = blueprint.artifacts.find((node) => node.path === "single.php");
    expect(single?.dependsOn).toContain("header.php");
  });

  it("summarizes the blueprint as markdown", () => {
    const doc = blueprintDoc(buildProjectBlueprint(resolveWordPressConfig({ siteName: "Daily" })));
    expect(doc).toContain("project blueprint");
    expect(doc).toContain("Core Web Vitals");
  });
});

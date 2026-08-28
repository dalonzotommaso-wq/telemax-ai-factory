import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isErr } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { generateLandingPageProject } from "./project.js";

const FIXED_AT = "2026-01-01T00:00:00.000Z";

describe("generateLandingPageProject (integration, writes to disk)", () => {
  it("generates a complete static landing page on disk", async () => {
    const outputDir = mkdtempSync(join(tmpdir(), "landing-"));
    const result = await generateLandingPageProject(
      { siteName: "Test Site" },
      { outputDir, year: 2026, generatedAt: FIXED_AT },
    );
    if (isErr(result)) {
      throw result.error;
    }
    const project = result.value;

    const required = [
      "index.html",
      "assets/css/style.css",
      "assets/css/tokens.css",
      "assets/js/main.js",
      "assets/images/.gitkeep",
      "config/content-plan.json",
      "config/design-tokens.json",
      "docs/NAMING-CONVENTIONS.md",
      "robots.txt",
      "README.md",
      ".telemax/build-info.json",
      ".telemax/manifest.json",
    ];
    for (const file of required) {
      expect(existsSync(join(outputDir, file))).toBe(true);
    }
    expect(project.fileCount).toBe(required.length);

    const html = readFileSync(join(outputDir, "index.html"), "utf-8");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Test Site");
    expect(html).toContain(FIXED_AT);

    const manifest = JSON.parse(
      readFileSync(join(outputDir, ".telemax/manifest.json"), "utf-8"),
    ) as {
      generator: string;
      generatorVersion: string;
      generatedAt: string;
      artifacts: { path: string; version: string; sha256: string }[];
    };
    expect(manifest.generator).toBe("landing-page");
    expect(manifest.generatorVersion).toBe("0.1.0");
    expect(manifest.generatedAt).toBe(FIXED_AT);
    for (const entry of manifest.artifacts) {
      expect(entry.sha256).toHaveLength(64);
      expect(entry.version).toBe("0.1.0");
    }
  });

  it("refuses an invalid configuration before writing anything", async () => {
    const outputDir = mkdtempSync(join(tmpdir(), "landing-bad-"));
    const result = await generateLandingPageProject({ siteName: "" }, { outputDir });
    expect(isErr(result)).toBe(true);
    expect(existsSync(join(outputDir, "index.html"))).toBe(false);
  });
});

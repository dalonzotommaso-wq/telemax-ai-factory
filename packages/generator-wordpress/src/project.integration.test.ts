import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isErr } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { generateWordPressNewsProject } from "./project.js";

const FIXED_AT = "2026-01-01T00:00:00.000Z";

describe("generateWordPressNewsProject (integration, writes to disk)", () => {
  it("generates a complete WordPress News project on disk", async () => {
    const outputDir = mkdtempSync(join(tmpdir(), "wp-news-"));
    const result = await generateWordPressNewsProject(
      { siteName: "Test News" },
      { outputDir, year: 2026, generatedAt: FIXED_AT },
    );
    if (isErr(result)) {
      throw result.error;
    }
    const project = result.value;
    expect(project.fileCount).toBeGreaterThan(50);

    const theme = "test-news";
    const required = [
      "style.css",
      "functions.php",
      "theme.json",
      "index.php",
      "front-page.php",
      "home.php",
      "single.php",
      "page.php",
      "archive.php",
      "category.php",
      "search.php",
      "author.php",
      "header.php",
      "footer.php",
      "sidebar.php",
      "404.php",
      "screenshot.svg",
      "assets/css/main.css",
      "assets/js/main.js",
      "README.md",
    ];
    for (const file of required) {
      expect(existsSync(join(outputDir, theme, file))).toBe(true);
    }

    // Every generated artifact carries the generator version.
    const functions = readFileSync(join(outputDir, theme, "functions.php"), "utf-8");
    expect(functions).toContain("TELEMAX_NEWS_THEME_VERSION");
    expect(functions).toContain(FIXED_AT);
    expect(functions).toContain("assets/css/main.css");

    // The manifest catalogs each artifact with version and a sha256 checksum.
    const manifestRaw = readFileSync(join(outputDir, ".telemax/manifest.json"), "utf-8");
    const manifest = JSON.parse(manifestRaw) as {
      generatorVersion: string;
      generatedAt: string;
      fileCount: number;
      artifacts: { path: string; version: string; sha256: string }[];
    };
    expect(manifest.generatorVersion).toBe("0.1.0");
    expect(manifest.generatedAt).toBe(FIXED_AT);
    expect(manifest.artifacts.length).toBeGreaterThan(50);
    const first = manifest.artifacts[0];
    expect(first?.version).toBe("0.1.0");
    expect(first?.sha256).toHaveLength(64);
  });

  it("refuses an invalid configuration before writing anything", async () => {
    const outputDir = mkdtempSync(join(tmpdir(), "wp-news-bad-"));
    const result = await generateWordPressNewsProject({ siteName: "" }, { outputDir });
    expect(isErr(result)).toBe(true);
    expect(existsSync(join(outputDir, "test-news"))).toBe(false);
  });
});

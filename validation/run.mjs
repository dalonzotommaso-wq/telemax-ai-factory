// QA validation runner — generates each project in isolation via the built package API.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateWordPressNewsProject } from "../packages/generator-wordpress/dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const configsDir = join(here, "configs");
const outputsDir = join(here, "outputs");
const logsDir = join(here, "logs");
const FIXED_AT = process.env["GEN_AT"] ?? "2026-08-01T12:00:00.000Z";

const files = readdirSync(configsDir)
  .filter((f) => f.endsWith(".json"))
  .sort();
const summary = [];
for (const file of files) {
  const key = file.replace(/^\d+-/, "").replace(/\.json$/, "");
  const config = JSON.parse(readFileSync(join(configsDir, file), "utf-8"));
  const outputDir = join(outputsDir, key);
  const started = Date.now();
  const result = await generateWordPressNewsProject(config, {
    outputDir,
    year: 2026,
    generatedAt: FIXED_AT,
  });
  const ms = Date.now() - started;
  const log = { config: file, siteName: config.siteName, outputDir, generatedAt: FIXED_AT, ms };
  if (result.ok === false) {
    log.status = "ERROR";
    log.error = result.error?.message ?? String(result.error);
  } else {
    log.status = "OK";
    log.fileCount = result.value.fileCount;
    log.manifestPath = result.value.manifestPath;
    log.themeDir = result.value.files[0]?.split("/")[0];
  }
  mkdirSync(logsDir, { recursive: true });
  writeFileSync(join(logsDir, `${key}.json`), JSON.stringify(log, null, 2) + "\n");
  summary.push(log);
  process.stdout.write(
    `${log.status.padEnd(5)} ${key.padEnd(24)} files=${log.fileCount ?? "-"} ${ms}ms\n`,
  );
}
writeFileSync(join(logsDir, "_summary.json"), JSON.stringify(summary, null, 2) + "\n");
const failed = summary.filter((s) => s.status !== "OK").length;
process.stdout.write(
  `\nGenerazioni: ${summary.length} · OK: ${summary.length - failed} · ERROR: ${failed}\n`,
);
process.exitCode = failed === 0 ? 0 : 1;

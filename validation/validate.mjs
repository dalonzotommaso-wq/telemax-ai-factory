// Deep per-project validator (Senior QA). Read-only checks over generated outputs.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const outputsDir = join(here, "outputs");
const configsDir = join(here, "configs");

const REQUIRED_FILES = [
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
const REQUIRED_DIRS = [
  "assets",
  "assets/css",
  "assets/js",
  "assets/images",
  "template-parts",
  "inc",
];
const LAYOUT_FILES = [
  "index.php",
  "front-page.php",
  "home.php",
  "single.php",
  "page.php",
  "archive.php",
  "category.php",
  "search.php",
  "author.php",
  "404.php",
];

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function phpHeuristicOk(src) {
  if (!src.startsWith("<?php")) return { ok: false, why: "no <?php opening" };
  const opens = (src.match(/\{/g) ?? []).length;
  const closes = (src.match(/\}/g) ?? []).length;
  if (opens !== closes) return { ok: false, why: `unbalanced braces ${opens}/${closes}` };
  const po = (src.match(/\(/g) ?? []).length;
  const pc = (src.match(/\)/g) ?? []).length;
  if (po !== pc) return { ok: false, why: `unbalanced parens ${po}/${pc}` };
  return { ok: true };
}

const results = [];
for (const key of readdirSync(outputsDir).sort()) {
  const root = join(outputsDir, key);
  if (!statSync(root).isDirectory()) continue;
  const checks = {};
  const cfgFile = readdirSync(configsDir).find(
    (f) => f.replace(/^\d+-/, "").replace(/\.json$/, "") === key,
  );
  const config = JSON.parse(readFileSync(join(configsDir, cfgFile), "utf-8"));

  // theme slug = single dir under root excluding .telemax
  const subdirs = readdirSync(root).filter(
    (d) => statSync(join(root, d)).isDirectory() && d !== ".telemax",
  );
  const theme = subdirs[0];
  const themeDir = join(root, theme);

  // 1. struttura cartelle
  checks.dirs = REQUIRED_DIRS.every((d) => existsSync(join(themeDir, d)));
  // 2. numero file
  const allFiles = walk(themeDir);
  checks.fileCount = allFiles.length;
  // 3. file mancanti
  const missing = REQUIRED_FILES.filter((f) => !existsSync(join(themeDir, f)));
  checks.requiredFiles = missing.length === 0;
  checks.missing = missing;
  // 4/5/6. include PHP + sintassi + link interni
  const phpFiles = allFiles.filter((f) => f.endsWith(".php"));
  let phpBad = [];
  let includeBad = [];
  for (const f of phpFiles) {
    const src = readFileSync(f, "utf-8");
    const h = phpHeuristicOk(src);
    if (!h.ok) phpBad.push(`${f.replace(themeDir + "/", "")}: ${h.why}`);
    // get_template_part references must resolve
    for (const m of src.matchAll(/get_template_part\(\s*'([^']+)'/g)) {
      const rel = m[1].endsWith(".php") ? m[1] : `${m[1]}.php`;
      if (!existsSync(join(themeDir, rel)) && !existsSync(join(themeDir, `${m[1]}.php`))) {
        includeBad.push(`${f.replace(themeDir + "/", "")} → ${m[1]}`);
      }
    }
  }
  checks.phpSyntax = phpBad.length === 0;
  checks.phpSyntaxIssues = phpBad;
  checks.includes = includeBad.length === 0;
  checks.includeIssues = includeBad;
  // layout files must call get_header + get_footer
  const layoutHeaderFooter = LAYOUT_FILES.filter((f) => existsSync(join(themeDir, f))).every(
    (f) => {
      const s = readFileSync(join(themeDir, f), "utf-8");
      return s.includes("get_header(") && s.includes("get_footer(");
    },
  );
  checks.layoutIncludes = layoutHeaderFooter;
  // internal links: menu paths present in header/navigation
  const navSrc = ["header.php", "template-parts/navigation.php", "navigation.php"]
    .map((f) => join(themeDir, f))
    .filter(existsSync)
    .map((f) => readFileSync(f, "utf-8"))
    .join("\n");
  checks.internalLinks = navSrc.includes("home_url") || navSrc.includes("bloginfo");
  // 7. metadata + versioni (functions.php)
  const fn = readFileSync(join(themeDir, "functions.php"), "utf-8");
  checks.metadata =
    fn.includes("TELEMAX_NEWS_THEME_VERSION") && fn.includes("TELEMAX_NEWS_GENERATED_AT");
  // 8. manifest
  const manifestPath = join(root, ".telemax/manifest.json");
  checks.manifestExists = existsSync(manifestPath);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  checks.manifestFields = [
    "generator",
    "generatorVersion",
    "generatedAt",
    "fileCount",
    "artifacts",
  ].every((k) => k in manifest);
  // 9. artefatti (fileCount coerente col numero di artefatti tema, escluso manifest stesso)
  checks.artifactCount = manifest.fileCount === manifest.artifacts.length;
  // 10. checksum
  let checksumBad = [];
  for (const a of manifest.artifacts) {
    const p = join(root, a.path);
    if (!existsSync(p)) {
      checksumBad.push(`${a.path}: file mancante`);
      continue;
    }
    const sha = createHash("sha256").update(readFileSync(p)).digest("hex");
    if (sha !== a.sha256) checksumBad.push(`${a.path}: checksum diverso`);
  }
  checks.checksums = checksumBad.length === 0;
  checks.checksumIssues = checksumBad.slice(0, 5);
  // 11. versioni
  checks.versions =
    manifest.generatorVersion === "0.1.0" && manifest.artifacts.every((a) => a.version === "0.1.0");
  // 12. README
  const readme = readFileSync(join(themeDir, "README.md"), "utf-8");
  checks.readme = readme.length > 100 && readme.includes(config.siteName);
  // 13. assets (primaryColor presente in main.css)
  const css = readFileSync(join(themeDir, "assets/css/main.css"), "utf-8");
  checks.assets = css.includes(config.primaryColor);
  // 14. template (tutte le pagine con header/footer già in layoutIncludes) + theme.json valido
  try {
    JSON.parse(readFileSync(join(themeDir, "theme.json"), "utf-8"));
    checks.themeJson = true;
  } catch {
    checks.themeJson = false;
  }
  // 15. configurazione (siteName in style.css header)
  const styleCss = readFileSync(join(themeDir, "style.css"), "utf-8");
  checks.configReflected = styleCss.includes(config.siteName);
  // blueprint config files
  checks.blueprintConfigs =
    existsSync(join(themeDir, "config")) &&
    readdirSync(join(themeDir, "config")).some((f) => f.endsWith(".blueprint.json"));

  const boolChecks = Object.entries(checks).filter(([, v]) => typeof v === "boolean");
  const passed = boolChecks.filter(([, v]) => v).length;
  results.push({
    key,
    siteName: config.siteName,
    theme,
    fileCount: checks.fileCount,
    passed,
    total: boolChecks.length,
    checks,
  });
}

// print matrix
const CHECK_KEYS = [
  "dirs",
  "requiredFiles",
  "phpSyntax",
  "includes",
  "layoutIncludes",
  "internalLinks",
  "metadata",
  "manifestExists",
  "manifestFields",
  "artifactCount",
  "checksums",
  "versions",
  "readme",
  "assets",
  "themeJson",
  "configReflected",
  "blueprintConfigs",
];
process.stdout.write("PROGETTO".padEnd(22) + CHECK_KEYS.map((k) => k.slice(0, 6)).join(" ") + "\n");
for (const r of results) {
  process.stdout.write(
    r.key.padEnd(22) +
      CHECK_KEYS.map((k) => (r.checks[k] ? "  ✓  " : "  ✗  ").padEnd(7).slice(0, 7)).join("") +
      ` ${r.passed}/${r.total}\n`,
  );
}
const anyFail = results.some((r) => r.passed !== r.total);
for (const r of results) {
  for (const k of CHECK_KEYS)
    if (!r.checks[k]) {
      process.stdout.write(
        `\n[FAIL] ${r.key} · ${k}: ${JSON.stringify(r.checks[k + "Issues"] ?? r.checks["missing"] ?? "")}`,
      );
    }
}
import { writeFileSync } from "node:fs";
writeFileSync(
  join(here, "reports", "validation-data.json"),
  JSON.stringify(results, null, 2) + "\n",
);
process.stdout.write(
  `\n\nProgetti: ${results.length} · tutti i check superati: ${anyFail ? "NO" : "SI"}\n`,
);
process.exitCode = anyFail ? 1 : 0;

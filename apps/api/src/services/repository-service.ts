// -----------------------------------------------------------------------------
// RepositoryService
//
// Performs a REAL scan of the monorepo â€” no static/fake data. It reads:
//   - pnpm-workspace.yaml   (workspace globs)
//   - <workspace>/package.json (name, version, deps, public API entry)
//   - turbo.json            (task pipeline)
//   - .changeset/*.md       (pending version bumps)
//   - .git (via the `git` CLI) (branch, last commit, last tag, dirty flag)
//   - build artifacts on disk (dist/, .next/) to derive build state
//
// Only Node.js built-ins are used (no new libraries, no new packages).
// -----------------------------------------------------------------------------
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

export interface PackageInfo {
  readonly name: string;
  readonly version: string;
  readonly private: boolean;
  readonly path: string;
  readonly description: string;
  readonly kind: "package" | "app";
  readonly internalDependencies: readonly string[];
  readonly externalDependencies: readonly string[];
  readonly publicApi: string;
  readonly built: boolean;
  readonly state: "built" | "source";
}

export interface AppInfo {
  readonly name: string;
  readonly version: string;
  readonly path: string;
  readonly description: string;
  readonly stack: readonly string[];
  readonly built: boolean;
}

export interface GeneratorInfo {
  readonly name: string;
  readonly version: string;
  readonly path: string;
}

export interface AIProviderInfo {
  readonly name: string;
  readonly implemented: boolean;
}

export interface KnowledgePackInfo {
  readonly name: string;
}

export interface WorkflowInfo {
  readonly package: string;
  readonly version: string;
}

export interface TestsInfo {
  readonly files: number;
  readonly cases: number;
  readonly byWorkspace: Readonly<Record<string, { files: number; cases: number }>>;
}

export interface BuildInfo {
  readonly status: "built" | "not-built" | "partial";
  readonly workspacesBuilt: number;
  readonly workspacesTotal: number;
  readonly artifactsPresent: boolean;
  readonly note: string;
}

export interface GitInfo {
  readonly available: boolean;
  readonly branch: string | null;
  readonly lastCommit: string | null;
  readonly lastCommitShort: string | null;
  readonly lastCommitSubject: string | null;
  readonly lastCommitDate: string | null;
  readonly lastCommitAuthor: string | null;
  readonly lastTag: string | null;
  readonly tagsOnHead: readonly string[];
  readonly dirty: boolean;
  readonly totalCommits: number | null;
  readonly pendingChangesets: number;
}

export interface RepositoryInfo {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly root: string;
  readonly turboTasks: readonly string[];
}

export interface RepositoryStatus {
  readonly repository: RepositoryInfo;
  readonly counts: {
    readonly packages: number;
    readonly apps: number;
    readonly generators: number;
    readonly tests: number;
    readonly endpoints: number;
  };
  readonly packages: readonly PackageInfo[];
  readonly apps: readonly AppInfo[];
  readonly generators: readonly GeneratorInfo[];
  readonly knowledgePacks: readonly KnowledgePackInfo[];
  readonly workflow: WorkflowInfo | null;
  readonly aiProviders: readonly AIProviderInfo[];
  readonly build: BuildInfo;
  readonly git: GitInfo;
  readonly scannedAt: string;
}

interface PackageJson {
  name?: string;
  version?: string;
  private?: boolean;
  description?: string;
  main?: string;
  module?: string;
  exports?: unknown;
  dependencies?: Record<string, string>;
}

/** Walk upwards from `start` until a directory containing pnpm-workspace.yaml is found. */
function findRepoRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

function safeReadJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

/** Minimal, dependency-free reader for the `packages:` glob list in pnpm-workspace.yaml. */
function readWorkspaceGlobs(root: string): string[] {
  const file = join(root, "pnpm-workspace.yaml");
  if (!existsSync(file)) return [];
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  const globs: string[] = [];
  let inPackages = false;
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "");
    if (/^packages\s*:/.test(line)) {
      inPackages = true;
      continue;
    }
    if (inPackages) {
      const match = /^\s*-\s*["']?([^"'\s]+)["']?\s*$/.exec(line);
      if (match) globs.push(match[1]);
      else if (/^\S/.test(line)) break; // next top-level key ends the list
    }
  }
  return globs;
}

/** Expand a workspace glob (exact dir or "<dir>/*") into concrete package directories. */
function expandGlob(root: string, glob: string): string[] {
  if (glob.endsWith("/*")) {
    const base = join(root, glob.slice(0, -2));
    if (!existsSync(base)) return [];
    return readdirSync(base)
      .map((entry) => join(base, entry))
      .filter((p) => statSync(p).isDirectory() && existsSync(join(p, "package.json")));
  }
  const dir = join(root, glob);
  return existsSync(join(dir, "package.json")) ? [dir] : [];
}

function describeExports(pkg: PackageJson): string {
  if (typeof pkg.exports === "string") return pkg.exports;
  if (pkg.exports && typeof pkg.exports === "object") {
    const root = (pkg.exports as Record<string, unknown>)["."];
    if (typeof root === "string") return root;
    if (root && typeof root === "object") {
      const r = root as Record<string, unknown>;
      const pick = r["import"] ?? r["default"] ?? r["types"];
      if (typeof pick === "string") return pick;
    }
  }
  return pkg.module ?? pkg.main ?? "src/index.ts";
}

function countTestsInDir(dir: string): { files: number; cases: number } {
  let files = 0;
  let cases = 0;
  const walk = (d: string): void => {
    if (!existsSync(d)) return;
    for (const entry of readdirSync(d)) {
      if (entry === "node_modules" || entry === "dist" || entry === ".next") continue;
      const full = join(d, entry);
      const s = statSync(full);
      if (s.isDirectory()) walk(full);
      else if (/\.test\.tsx?$/.test(entry)) {
        files += 1;
        const content = readFileSync(full, "utf8");
        const matches = content.match(/\b(it|test)\s*\(/g);
        cases += matches ? matches.length : 0;
      }
    }
  };
  walk(dir);
  return { files, cases };
}

export class RepositoryService {
  private readonly root: string;

  constructor(root?: string) {
    this.root = root ?? findRepoRoot(dirname(fileURLToPath(import.meta.url)));
  }

  get repoRoot(): string {
    return this.root;
  }

  private workspaceDirs(): string[] {
    return readWorkspaceGlobs(this.root)
      .flatMap((g) => expandGlob(this.root, g))
      .sort();
  }

  private toPackageInfo(dir: string): PackageInfo | null {
    const pkg = safeReadJson<PackageJson>(join(dir, "package.json"));
    if (!pkg?.name) return null;
    const deps = pkg.dependencies ?? {};
    const rel = (dir.slice(this.root.length + 1) || basename(dir)).replace(/\\/g, "/");
    const kind: "package" | "app" = rel.startsWith("apps/") ? "app" : "package";
    const built =
      existsSync(join(dir, "dist")) || (kind === "app" && existsSync(join(dir, ".next")));
    return {
      name: pkg.name,
      version: pkg.version ?? "0.0.0",
      private: pkg.private === true,
      path: rel,
      description: pkg.description ?? "",
      kind,
      internalDependencies: Object.keys(deps).filter((d) => d.startsWith("@telemax/")),
      externalDependencies: Object.keys(deps).filter((d) => !d.startsWith("@telemax/")),
      publicApi: describeExports(pkg),
      built,
      state: built ? "built" : "source",
    };
  }

  private allWorkspaces(): PackageInfo[] {
    return this.workspaceDirs()
      .map((d) => this.toPackageInfo(d))
      .filter((p): p is PackageInfo => p !== null);
  }

  getPackages(): PackageInfo[] {
    return this.allWorkspaces().filter((p) => p.kind === "package");
  }

  getApps(): AppInfo[] {
    return this.allWorkspaces()
      .filter((p) => p.kind === "app")
      .map((p) => ({
        name: p.name,
        version: p.version,
        path: p.path,
        description: p.description,
        stack: p.externalDependencies,
        built: p.built,
      }));
  }

  getGenerators(): GeneratorInfo[] {
    return this.getPackages()
      .filter((p) => p.name.includes("generator"))
      .map((p) => ({ name: p.name, version: p.version, path: p.path }));
  }

  getKnowledgePacks(): KnowledgePackInfo[] {
    const packs: KnowledgePackInfo[] = [];
    if (this.getPackages().some((p) => p.name === "@telemax/knowledge")) {
      packs.push({ name: "@telemax/knowledge" });
    }
    const dir = join(this.root, "knowledge");
    if (existsSync(dir)) {
      for (const entry of readdirSync(dir)) {
        if (entry.startsWith(".") || entry === "README.md") continue;
        packs.push({ name: entry });
      }
    }
    return packs;
  }

  getWorkflow(): WorkflowInfo | null {
    const wf = this.getPackages().find((p) => p.name === "@telemax/workflow");
    return wf ? { package: wf.name, version: wf.version } : null;
  }

  getAIProviders(): AIProviderInfo[] {
    const dir = join(this.root, "packages", "ai", "src", "providers");
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((f) => /-provider\.ts$/.test(f) && !f.endsWith(".test.ts"))
      .map((f) => ({
        name: basename(f, ".ts").replace("-provider", ""),
        implemented: !f.startsWith("stub"),
      }));
  }

  getTests(): TestsInfo {
    const byWorkspace: Record<string, { files: number; cases: number }> = {};
    let files = 0;
    let cases = 0;
    for (const dir of this.workspaceDirs()) {
      const res = countTestsInDir(join(dir, "src"));
      if (res.files > 0) {
        const rel = (dir.slice(this.root.length + 1) || basename(dir)).replace(/\\/g, "/");
        byWorkspace[rel] = res;
        files += res.files;
        cases += res.cases;
      }
    }
    return { files, cases, byWorkspace };
  }

  getBuild(): BuildInfo {
    const ws = this.allWorkspaces();
    const built = ws.filter((p) => p.built).length;
    const total = ws.length;
    const status: BuildInfo["status"] =
      built === 0 ? "not-built" : built === total ? "built" : "partial";
    return {
      status,
      workspacesBuilt: built,
      workspacesTotal: total,
      artifactsPresent: built > 0,
      note: "Derived from build artifacts on disk (dist/, .next/).",
    };
  }

  private git(args: string[]): string | null {
    try {
      return execFileSync("git", args, {
        cwd: this.root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return null;
    }
  }

  private countChangesets(): number {
    const dir = join(this.root, ".changeset");
    if (!existsSync(dir)) return 0;
    return readdirSync(dir).filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
      .length;
  }

  getGit(): GitInfo {
    const branch = this.git(["rev-parse", "--abbrev-ref", "HEAD"]);
    const available = branch !== null;
    const tagsRaw = available ? this.git(["tag", "--points-at", "HEAD"]) : null;
    const totalRaw = available ? this.git(["rev-list", "--count", "HEAD"]) : null;
    return {
      available,
      branch,
      lastCommit: available ? this.git(["rev-parse", "HEAD"]) : null,
      lastCommitShort: available ? this.git(["rev-parse", "--short", "HEAD"]) : null,
      lastCommitSubject: available ? this.git(["log", "-1", "--pretty=%s"]) : null,
      lastCommitDate: available ? this.git(["log", "-1", "--pretty=%cI"]) : null,
      lastCommitAuthor: available ? this.git(["log", "-1", "--pretty=%an"]) : null,
      lastTag: available ? this.git(["describe", "--tags", "--abbrev=0"]) : null,
      tagsOnHead: tagsRaw ? tagsRaw.split(/\r?\n/).filter(Boolean) : [],
      dirty: available ? (this.git(["status", "--porcelain"]) ?? "").length > 0 : false,
      totalCommits: totalRaw ? Number(totalRaw) : null,
      pendingChangesets: this.countChangesets(),
    };
  }

  getRepository(): RepositoryInfo {
    const root = safeReadJson<PackageJson>(join(this.root, "package.json"));
    const turbo = safeReadJson<{ tasks?: Record<string, unknown> }>(join(this.root, "turbo.json"));
    return {
      name: root?.name ?? "unknown",
      version: root?.version ?? "0.0.0",
      description: root?.description ?? "",
      root: this.root,
      turboTasks: turbo?.tasks ? Object.keys(turbo.tasks) : [],
    };
  }

  /** Full aggregate. `endpointCount` is injected by the API layer from the live route table. */
  getStatus(endpointCount = 0): RepositoryStatus {
    const packages = this.getPackages();
    const apps = this.getApps();
    const generators = this.getGenerators();
    const tests = this.getTests();
    return {
      repository: this.getRepository(),
      counts: {
        packages: packages.length,
        apps: apps.length,
        generators: generators.length,
        tests: tests.cases,
        endpoints: endpointCount,
      },
      packages,
      apps,
      generators,
      knowledgePacks: this.getKnowledgePacks(),
      workflow: this.getWorkflow(),
      aiProviders: this.getAIProviders(),
      build: this.getBuild(),
      git: this.getGit(),
      scannedAt: new Date().toISOString(),
    };
  }
}

// -----------------------------------------------------------------------------
// WorkspaceService
//
// Materialises a real workspace on disk for each project:
//   workspace/<slug>/{docs,assets,prompts,output,logs,uploads,build}
// and writes workspace/<slug>/project.json with the full project configuration.
//
// Only Node.js built-ins are used (no new libraries, no new packages).
// -----------------------------------------------------------------------------
import { existsSync, mkdirSync, writeFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Project } from "../domain.js";

export const WORKSPACE_DIRS = [
  "docs",
  "assets",
  "prompts",
  "output",
  "logs",
  "uploads",
  "build",
] as const;

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

export interface WorkspaceInfo {
  readonly path: string;
  readonly created: boolean;
  readonly folders: readonly string[];
}

export class WorkspaceService {
  private readonly root: string;

  constructor(root?: string) {
    this.root =
      root ??
      process.env["WORKSPACE_ROOT"] ??
      join(findRepoRoot(dirname(fileURLToPath(import.meta.url))), "workspace");
  }

  get workspaceRoot(): string {
    return this.root;
  }

  /** Absolute path of a project workspace, derived from its slug. */
  pathFor(project: Pick<Project, "slug">): string {
    return resolve(this.root, project.slug);
  }

  /** Create the workspace folder tree and write project.json. Idempotent. */
  create(project: Project): WorkspaceInfo {
    const base = this.pathFor(project);
    const existedBefore = existsSync(base);
    for (const folder of WORKSPACE_DIRS) {
      mkdirSync(join(base, folder), { recursive: true });
    }
    this.writeManifest(project, base);
    return { path: base, created: !existedBefore, folders: [...WORKSPACE_DIRS] };
  }

  /** (Re)write the project.json manifest with the full project configuration. */
  writeManifest(project: Project, base: string = this.pathFor(project)): void {
    mkdirSync(base, { recursive: true });
    const manifest = {
      uuid: project.uuid,
      slug: project.slug,
      name: project.name,
      description: project.description,
      client: project.client,
      category: project.category,
      type: project.type,
      stack: project.stack,
      generator: project.generator,
      workflow: project.workflow,
      knowledgePack: project.knowledgePack,
      aiProvider: project.aiProvider,
      version: project.version,
      status: project.status,
      workspace: project.workspace,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
    writeFileSync(join(base, "project.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }

  /** Remove a project workspace from disk (used by delete, best-effort). */
  remove(project: Pick<Project, "slug">): void {
    const base = this.pathFor(project);
    if (existsSync(base)) rmSync(base, { recursive: true, force: true });
  }

  exists(project: Pick<Project, "slug">): boolean {
    return existsSync(this.pathFor(project));
  }

  /** List the folders actually present in a project workspace. */
  folders(project: Pick<Project, "slug">): string[] {
    const base = this.pathFor(project);
    if (!existsSync(base)) return [];
    return readdirSync(base).filter((e) => statSync(join(base, e)).isDirectory());
  }
}

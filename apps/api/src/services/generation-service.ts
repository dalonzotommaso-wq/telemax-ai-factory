// -----------------------------------------------------------------------------
// GenerationService
//
// Connects the Project Manager to the existing Generator Engine. It loads the
// project's workspace/project.json, resolves the installed generator and runs
// the REAL generation pipeline (Workflow -> Knowledge -> Prompt -> AI ->
// Generator Engine -> Output) using only the code already shipped in the
// @telemax/* packages. Every phase, every produced file and the final status
// are recorded in the database.
// -----------------------------------------------------------------------------
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { deflateRawSync } from "node:zlib";
import { isErr } from "@telemax/core";
import { GeneratorEngine } from "@telemax/generator-engine";
import { WorkflowEngine } from "@telemax/workflow";
import {
  assembleVariables,
  buildPromptEngine,
  registerWordPressNews,
  resolveWordPressConfig,
  seedKnowledge,
  validateProject,
  writeProject,
  WORDPRESS_NEWS_GENERATOR,
  type WordPressSiteConfig,
} from "@telemax/generator-wordpress";
import type { Db } from "../db.js";
import type { Project } from "../domain.js";
import type { WorkspaceService } from "./workspace-service.js";
import {
  addFile,
  addLog,
  createGeneration,
  finishGeneration,
  getGeneration,
  type Generation,
} from "../repositories/generation-repository.js";

interface ProjectManifest {
  name?: string;
  slug?: string;
  generator?: string;
  workflow?: string;
  knowledgePack?: string;
  aiProvider?: string;
  type?: string;
}

/** Recursively list every file under a directory (absolute paths). */
function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

// --- Minimal ZIP writer (deflate) using only node:zlib — no external package. ---
const CRC_TABLE = ((): Uint32Array => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) === 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = (CRC_TABLE[(c ^ buf[i]) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Buffer;
}

/** Build a ZIP archive (deflate, storing when smaller) from in-memory entries. */
function buildZip(entries: readonly ZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, "utf8");
    const crc = crc32(entry.data);
    const deflated = deflateRawSync(entry.data);
    const useDeflate = deflated.length < entry.data.length;
    const method = useDeflate ? 8 : 0;
    const body = useDeflate ? deflated : entry.data;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + body.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

export class GenerationService {
  constructor(
    private readonly db: Db,
    private readonly workspace: WorkspaceService,
  ) {}

  /** Load workspace/<slug>/project.json, writing it first if it is missing. */
  private loadManifest(project: Project): ProjectManifest {
    const file = join(this.workspace.pathFor(project), "project.json");
    if (!existsSync(file)) this.workspace.writeManifest(project);
    return JSON.parse(readFileSync(file, "utf8")) as ProjectManifest;
  }

  /** Run a full generation for the project and record everything. */
  async generate(project: Project): Promise<Generation> {
    const generation = createGeneration(this.db, project.id, project.generator);
    const id = generation.id;
    const log = (phase: string, message: string): void => addLog(this.db, id, phase, message);
    const outputDir = join(this.workspace.pathFor(project), "output");

    try {
      // ---- Preparation: load project.json and resolve the target generator ----
      log("preparation", "Loading workspace/project.json");
      const manifest = this.loadManifest(project);
      const generatorId = manifest.generator || project.generator;
      log(
        "preparation",
        `Project "${manifest.name ?? project.name}" — generator=${generatorId || "none"}, ` +
          `workflow=${manifest.workflow || "-"}, knowledge=${manifest.knowledgePack || "-"}, ` +
          `provider=${manifest.aiProvider || "-"}`,
      );

      const isWordPress =
        generatorId.includes("generator-wordpress") ||
        (manifest.type ?? project.type) === "wordpress-news";
      if (!isWordPress) {
        throw new Error(
          `No runnable generator installed for "${generatorId || project.type}". ` +
            `The only installed generator is @telemax/generator-wordpress.`,
        );
      }

      const config: WordPressSiteConfig = {
        siteName: manifest.name ?? project.name,
        siteUrl: `https://${project.slug}.telemax.local`,
      };
      const validation = validateProject(config);
      if (isErr(validation)) throw new Error(validation.error.message);
      const resolved = resolveWordPressConfig(config);

      // ---- Knowledge ----
      log("knowledge", `Seeding knowledge base (${manifest.knowledgePack || "@telemax/knowledge"})`);
      const knowledge = await seedKnowledge();

      // ---- Workflow ----
      log("workflow", "Initialising workflow engine");
      const workflow = new WorkflowEngine();

      // ---- AI / Prompt ----
      log("ai", `Building prompt engine and AI provider (${manifest.aiProvider || "stub"})`);
      const prompt = await buildPromptEngine();

      // ---- Generator Engine ----
      log("generator", "Registering generator and producing artifacts");
      const generator = new GeneratorEngine();
      const registered = registerWordPressNews({ generator, workflow, prompt, knowledge }, resolved);
      if (isErr(registered)) throw new Error(registered.error.message);
      const generatedAt = new Date().toISOString();
      const produced = await generator.generate(
        WORDPRESS_NEWS_GENERATOR,
        assembleVariables(resolved, new Date().getFullYear(), generatedAt),
      );
      if (isErr(produced)) throw new Error(produced.error.message);

      // ---- Writing output ----
      const artifacts = produced.value.artifacts.list();
      log("writing", `Writing ${String(artifacts.length)} artifacts to output/`);
      const written = writeProject(artifacts, outputDir, { generatedAt });
      if (isErr(written)) throw new Error(written.error.message);

      // ---- Register every produced file (name, path, size, hash, timestamp) ----
      for (const abs of walkFiles(outputDir)) {
        const rel = abs.slice(outputDir.length + 1);
        const content = readFileSync(abs);
        addFile(this.db, id, {
          name: rel.split("/").pop() ?? rel,
          path: rel,
          bytes: content.byteLength,
          sha256: createHash("sha256").update(content).digest("hex"),
        });
      }

      // ---- Export: package the generated theme into export/theme.zip ----
      log("writing", "Packaging theme into export/theme.zip");
      const exportDir = join(this.workspace.pathFor(project), "export");
      mkdirSync(exportDir, { recursive: true });
      const zipEntries = walkFiles(outputDir).map((abs) => ({
        name: abs.slice(outputDir.length + 1),
        data: readFileSync(abs),
      }));
      const zipData = buildZip(zipEntries);
      const zipPath = join(exportDir, "theme.zip");
      writeFileSync(zipPath, zipData);
      log("writing", `Theme packaged (${String(zipData.byteLength)} bytes) at export/theme.zip`);

      log("completed", `Generation completed — ${String(written.value.fileCount)} files`);
      return finishGeneration(this.db, id, {
        status: "completed",
        fileCount: written.value.fileCount,
        outputDir,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog(this.db, id, "error", message, "error");
      return finishGeneration(this.db, id, {
        status: "failed",
        fileCount: 0,
        outputDir,
        error: message,
      });
    }
  }

  getGeneration(id: number): Generation | undefined {
    return getGeneration(this.db, id);
  }
}

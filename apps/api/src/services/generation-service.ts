// -----------------------------------------------------------------------------
// GenerationService
//
// Connects the Project Manager to the Generator Engine. It loads the project's
// workspace/project.json, resolves the installed generator adapter (see
// ./generators/registry) and runs the REAL generation pipeline (Workflow ->
// Knowledge -> Prompt -> AI -> Generator Engine -> Output) using only the code
// already shipped in the @telemax/* packages. Every phase, every produced file
// and the final status are recorded in the database, and the output is packaged
// into export/site.zip.
// -----------------------------------------------------------------------------
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { deflateRawSync } from "node:zlib";
import type { Db } from "../db.js";
import type { Project } from "../domain.js";
import type { WorkspaceService } from "./workspace-service.js";
import type { ProjectManifest } from "./generators/adapter.js";
import { resolveAdapter } from "./generators/registry.js";
import {
  addFile,
  addLog,
  createGeneration,
  finishGeneration,
  getGeneration,
  type Generation,
} from "../repositories/generation-repository.js";

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
      const adapter = resolveAdapter(project, manifest);
      log(
        "preparation",
        `Project "${manifest.name ?? project.name}" — generator=${adapter.id}, ` +
          `workflow=${manifest.workflow || "-"}, knowledge=${manifest.knowledgePack || "-"}, ` +
          `provider=${manifest.aiProvider || "-"}`,
      );

      // ---- Run the resolved generator adapter (Knowledge -> Workflow -> AI -> Engine -> Output) ----
      const generatedAt = new Date().toISOString();
      const runResult = await adapter.run({
        project,
        manifest,
        outputDir,
        generatedAt,
        year: new Date().getFullYear(),
        log,
      });

      // Content Plan observability: AI vs deterministic fallback + validation.
      log("ai", `Content Plan: ${runResult.contentPlan.source}`);
      log("ai", `Validation: ${runResult.contentPlan.validation}`);

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

      // ---- Export: package the generated project into export/site.zip ----
      log("writing", "Packaging project into export/site.zip");
      const exportDir = join(this.workspace.pathFor(project), "export");
      mkdirSync(exportDir, { recursive: true });
      const zipEntries = walkFiles(outputDir).map((abs) => ({
        name: abs.slice(outputDir.length + 1),
        data: readFileSync(abs),
      }));
      const zipData = buildZip(zipEntries);
      writeFileSync(join(exportDir, "site.zip"), zipData);
      log("writing", `Project packaged (${String(zipData.byteLength)} bytes) at export/site.zip`);

      log("completed", `Generation completed — ${String(runResult.fileCount)} files`);
      return finishGeneration(this.db, id, {
        status: "completed",
        fileCount: runResult.fileCount,
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

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
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
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

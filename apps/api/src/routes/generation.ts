import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { getProject } from "../repositories/project-repository.js";
import {
  latestGenerationForProject,
  listFiles,
  listGenerationsForProject,
  listLogs,
} from "../repositories/generation-repository.js";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) ? id : null;
}

export async function generationRoutes(app: FastifyInstance): Promise<void> {
  const db = app.db;

  // Trigger a real generation for the project.
  app.post(
    "/projects/:id/generate",
    { schema: { description: "Run the generator for a project.", tags: ["projects"] } },
    async (request, reply) => {
      const id = parseId((request.params as { id: string }).id);
      if (id === null) return reply.code(400).send({ error: "Invalid id" });
      const project = getProject(db, id);
      if (!project) return reply.code(404).send({ error: "Project not found" });
      const generation = await app.generation.generate(project);
      const files = listFiles(db, generation.id);
      return reply.code(generation.status === "failed" ? 200 : 201).send({ ...generation, files });
    },
  );

  // Latest generation for the project (with its files), plus history.
  app.get(
    "/projects/:id/generation",
    { schema: { description: "Latest generation status for a project.", tags: ["projects"] } },
    async (request, reply) => {
      const id = parseId((request.params as { id: string }).id);
      if (id === null) return reply.code(400).send({ error: "Invalid id" });
      const latest = latestGenerationForProject(db, id);
      if (!latest) return reply.code(404).send({ error: "No generation for this project" });
      return {
        ...latest,
        files: listFiles(db, latest.id),
        history: listGenerationsForProject(db, id).map((g) => ({
          id: g.id,
          status: g.status,
          startedAt: g.startedAt,
          fileCount: g.fileCount,
        })),
      };
    },
  );

  // Logs for the latest generation (or a specific one via ?generationId).
  app.get(
    "/projects/:id/logs",
    { schema: { description: "Logs for a project's generation.", tags: ["projects"] } },
    async (request, reply) => {
      const id = parseId((request.params as { id: string }).id);
      if (id === null) return reply.code(400).send({ error: "Invalid id" });
      const query = request.query as { generationId?: string };
      const generationId = query.generationId
        ? Number(query.generationId)
        : latestGenerationForProject(db, id)?.id;
      if (generationId === undefined) return reply.code(404).send({ error: "No generation" });
      return listLogs(db, generationId);
    },
  );

  // Download the generated theme as a ZIP archive.
  app.get(
    "/projects/:id/download/theme",
    { schema: { description: "Download the generated theme as theme.zip.", tags: ["projects"] } },
    async (request, reply) => {
      const id = parseId((request.params as { id: string }).id);
      if (id === null) return reply.code(400).send({ error: "Invalid id" });
      const project = getProject(db, id);
      if (!project) return reply.code(404).send({ error: "Project not found" });
      const zipPath = join(app.workspace.pathFor(project), "export", "theme.zip");
      if (!existsSync(zipPath)) {
        return reply
          .code(404)
          .send({ error: "Theme archive not found — generate the project first" });
      }
      return reply
        .header("Content-Type", "application/zip")
        .header("Content-Disposition", `attachment; filename="${project.slug}-theme.zip"`)
        .send(readFileSync(zipPath));
    },
  );
}

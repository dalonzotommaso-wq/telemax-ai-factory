import type { FastifyInstance } from "fastify";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
  type ListOptions,
  type SortField,
  type SortOrder,
} from "../repositories/project-repository.js";
import {
  PROJECT_STATUSES,
  PROJECT_TYPES,
  isProjectStatus,
  isProjectType,
  type CreateProjectInput,
  type Project,
  type UpdateProjectInput,
} from "../domain.js";

const projectProperties = {
  name: { type: "string", minLength: 1, maxLength: 200 },
  type: { type: "string", enum: [...PROJECT_TYPES] },
  description: { type: "string", maxLength: 2000 },
  client: { type: "string", maxLength: 200 },
  category: { type: "string", maxLength: 100 },
  stack: { type: "string", maxLength: 500 },
  generator: { type: "string", maxLength: 120 },
  workflow: { type: "string", maxLength: 120 },
  knowledgePack: { type: "string", maxLength: 120 },
  aiProvider: { type: "string", maxLength: 120 },
  version: { type: "string", maxLength: 40 },
  status: { type: "string", enum: [...PROJECT_STATUSES] },
} as const;

const projectBody = {
  type: "object",
  required: ["name", "type"],
  additionalProperties: false,
  properties: projectProperties,
} as const;

const updateBody = {
  type: "object",
  additionalProperties: false,
  properties: projectProperties,
} as const;

/** Create the on-disk workspace and manifest for a project, then persist the log. */
function materialise(app: FastifyInstance, project: Project): void {
  const ws = app.workspace.create(project);
  app.log.info({ id: project.id, uuid: project.uuid, workspace: ws.path }, "project workspace created");
}

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  const db = app.db;

  app.get(
    "/projects",
    {
      schema: {
        description: "List projects with optional search and sorting.",
        tags: ["projects"],
        querystring: {
          type: "object",
          properties: {
            q: { type: "string" },
            sort: { type: "string", enum: ["name", "createdAt", "updatedAt", "status", "type"] },
            order: { type: "string", enum: ["asc", "desc"] },
            limit: { type: "integer", minimum: 1, maximum: 100 },
          },
        },
      },
    },
    async (request) => {
      const { q, sort, order, limit } = request.query as {
        q?: string;
        sort?: SortField;
        order?: SortOrder;
        limit?: number;
      };
      const opts: ListOptions = {};
      if (q !== undefined) opts.q = q;
      if (sort !== undefined) opts.sort = sort;
      if (order !== undefined) opts.order = order;
      if (limit !== undefined) opts.limit = limit;
      return listProjects(db, opts);
    },
  );

  app.get("/projects/:id", { schema: { tags: ["projects"] } }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id)) return reply.code(400).send({ error: "Invalid id" });
    const project = getProject(db, id);
    if (!project) return reply.code(404).send({ error: "Project not found" });
    return project;
  });

  app.post(
    "/projects",
    { schema: { body: projectBody, tags: ["projects"] } },
    async (request, reply) => {
      const body = request.body as CreateProjectInput;
      if (!isProjectType(body.type)) return reply.code(400).send({ error: "Invalid type" });
      if (body.status !== undefined && !isProjectStatus(body.status)) {
        return reply.code(400).send({ error: "Invalid status" });
      }
      const created = createProject(db, body);
      materialise(app, created);
      return reply.code(201).send(created);
    },
  );

  app.put(
    "/projects/:id",
    { schema: { body: updateBody, tags: ["projects"] } },
    async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id)) return reply.code(400).send({ error: "Invalid id" });
      const updated = updateProject(db, id, request.body as UpdateProjectInput);
      if (!updated) return reply.code(404).send({ error: "Project not found" });
      app.workspace.writeManifest(updated); // keep project.json in sync
      request.log.info({ id }, "project updated");
      return updated;
    },
  );

  app.delete("/projects/:id", { schema: { tags: ["projects"] } }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id)) return reply.code(400).send({ error: "Invalid id" });
    const ok = deleteProject(db, id);
    if (!ok) return reply.code(404).send({ error: "Project not found" });
    request.log.info({ id }, "project deleted");
    return reply.code(204).send();
  });

  app.post("/projects/:id/archive", { schema: { tags: ["projects"] } }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id)) return reply.code(400).send({ error: "Invalid id" });
    const updated = updateProject(db, id, { status: "archived" });
    if (!updated) return reply.code(404).send({ error: "Project not found" });
    app.workspace.writeManifest(updated);
    request.log.info({ id }, "project archived");
    return updated;
  });

  app.post(
    "/projects/:id/duplicate",
    { schema: { tags: ["projects"] } },
    async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id)) return reply.code(400).send({ error: "Invalid id" });
      const source = getProject(db, id);
      if (!source) return reply.code(404).send({ error: "Project not found" });
      const copy = createProject(db, {
        name: `${source.name} (copy)`,
        type: source.type,
        description: source.description,
        client: source.client,
        category: source.category,
        stack: source.stack,
        generator: source.generator,
        workflow: source.workflow,
        knowledgePack: source.knowledgePack,
        aiProvider: source.aiProvider,
        version: source.version,
        status: "draft",
      });
      materialise(app, copy);
      request.log.info({ id, copyId: copy.id }, "project duplicated");
      return reply.code(201).send(copy);
    },
  );
}

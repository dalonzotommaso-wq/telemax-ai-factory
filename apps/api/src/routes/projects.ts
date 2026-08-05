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
  type UpdateProjectInput,
} from "../domain.js";

const projectBody = {
  type: "object",
  required: ["name", "type"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1, maxLength: 200 },
    type: { type: "string", enum: [...PROJECT_TYPES] },
    description: { type: "string", maxLength: 2000 },
    status: { type: "string", enum: [...PROJECT_STATUSES] },
    stack: { type: "string", maxLength: 500 },
    version: { type: "string", maxLength: 40 },
  },
} as const;

const updateBody = {
  type: "object",
  additionalProperties: false,
  properties: projectBody.properties,
} as const;

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
            sort: { type: "string", enum: ["name", "createdAt", "status", "type"] },
            order: { type: "string", enum: ["asc", "desc"] },
          },
        },
      },
    },
    async (request) => {
      const { q, sort, order } = request.query as {
        q?: string;
        sort?: SortField;
        order?: SortOrder;
      };
      const opts: ListOptions = {};
      if (q !== undefined) opts.q = q;
      if (sort !== undefined) opts.sort = sort;
      if (order !== undefined) opts.order = order;
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
      request.log.info({ id: created.id, uuid: created.uuid }, "project created");
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
}

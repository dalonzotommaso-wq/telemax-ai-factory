import { randomUUID } from "node:crypto";
import type { Db } from "../db.js";
import { slugify, type CreateProjectInput, type Project, type UpdateProjectInput } from "../domain.js";

export type SortField = "name" | "createdAt" | "updatedAt" | "status" | "type";
export type SortOrder = "asc" | "desc";

export interface ListOptions {
  q?: string;
  sort?: SortField;
  order?: SortOrder;
  limit?: number;
}

const SORT_FIELDS: readonly SortField[] = ["name", "createdAt", "updatedAt", "status", "type"];

export function listProjects(db: Db, options: ListOptions = {}): Project[] {
  const sort: SortField = SORT_FIELDS.includes(options.sort as SortField)
    ? (options.sort as SortField)
    : "createdAt";
  const order: SortOrder = options.order === "asc" ? "asc" : "desc";
  const q = options.q?.trim();
  const where = q ? "WHERE name LIKE @like OR description LIKE @like OR client LIKE @like" : "";
  const limit = options.limit && options.limit > 0 ? ` LIMIT ${Math.floor(options.limit)}` : "";
  const sql = `SELECT * FROM projects ${where} ORDER BY ${sort} ${order.toUpperCase()}${limit}`;
  const stmt = db.prepare(sql);
  return (q ? stmt.all({ like: `%${q}%` }) : stmt.all()) as Project[];
}

export function countProjects(db: Db): number {
  const row = db.prepare("SELECT COUNT(*) AS n FROM projects").get() as { n: number };
  return row.n;
}

export function getProject(db: Db, id: number): Project | undefined {
  return db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project | undefined;
}

function uniqueSlug(db: Db, base: string, id: number): string {
  const clash = db
    .prepare("SELECT COUNT(*) AS n FROM projects WHERE slug = ? AND id != ?")
    .get(base, id) as { n: number };
  return clash.n > 0 ? `${base}-${id}` : base;
}

export function createProject(db: Db, input: CreateProjectInput): Project {
  const now = new Date().toISOString();
  const uuid = randomUUID();
  const info = db
    .prepare(
      `INSERT INTO projects
         (uuid, slug, name, description, client, category, type, stack, generator, workflow,
          knowledgePack, aiProvider, version, status, workspace, createdAt, updatedAt)
       VALUES
         (@uuid, '', @name, @description, @client, @category, @type, @stack, @generator, @workflow,
          @knowledgePack, @aiProvider, @version, @status, '', @createdAt, @updatedAt)`,
    )
    .run({
      uuid,
      name: input.name,
      description: input.description ?? "",
      client: input.client ?? "",
      category: input.category ?? "",
      type: input.type,
      stack: input.stack ?? "",
      generator: input.generator ?? "",
      workflow: input.workflow ?? "",
      knowledgePack: input.knowledgePack ?? "",
      aiProvider: input.aiProvider ?? "",
      version: input.version ?? "0.1.0",
      status: input.status ?? "draft",
      createdAt: now,
      updatedAt: now,
    });
  const id = Number(info.lastInsertRowid);
  const slug = uniqueSlug(db, slugify(input.name), id);
  db.prepare("UPDATE projects SET slug = @slug, workspace = @workspace WHERE id = @id").run({
    slug,
    workspace: `workspace/${slug}`,
    id,
  });
  return getProject(db, id) as Project;
}

const UPDATABLE = [
  "name",
  "description",
  "client",
  "category",
  "type",
  "stack",
  "generator",
  "workflow",
  "knowledgePack",
  "aiProvider",
  "version",
  "status",
] as const;

export function updateProject(db: Db, id: number, patch: UpdateProjectInput): Project | undefined {
  const existing = getProject(db, id);
  if (!existing) return undefined;
  const merged: Record<string, unknown> = { id, updatedAt: new Date().toISOString() };
  for (const field of UPDATABLE) {
    merged[field] = (patch as Record<string, unknown>)[field] ?? existing[field];
  }
  db.prepare(
    `UPDATE projects SET
       name=@name, description=@description, client=@client, category=@category, type=@type,
       stack=@stack, generator=@generator, workflow=@workflow, knowledgePack=@knowledgePack,
       aiProvider=@aiProvider, version=@version, status=@status, updatedAt=@updatedAt
     WHERE id=@id`,
  ).run(merged);
  return getProject(db, id);
}

export function deleteProject(db: Db, id: number): boolean {
  const info = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return info.changes > 0;
}

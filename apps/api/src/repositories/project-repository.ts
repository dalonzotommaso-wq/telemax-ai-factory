import { randomUUID } from "node:crypto";
import type { Db } from "../db.js";
import type { CreateProjectInput, Project, UpdateProjectInput } from "../domain.js";

export type SortField = "name" | "createdAt" | "status" | "type";
export type SortOrder = "asc" | "desc";

export interface ListOptions {
  q?: string;
  sort?: SortField;
  order?: SortOrder;
}

const SORT_FIELDS: readonly SortField[] = ["name", "createdAt", "status", "type"];

export function listProjects(db: Db, options: ListOptions = {}): Project[] {
  const sort: SortField = SORT_FIELDS.includes(options.sort as SortField)
    ? (options.sort as SortField)
    : "createdAt";
  const order: SortOrder = options.order === "asc" ? "asc" : "desc";
  const q = options.q?.trim();
  const where = q ? "WHERE name LIKE @like OR description LIKE @like" : "";
  const sql = `SELECT * FROM projects ${where} ORDER BY ${sort} ${order.toUpperCase()}`;
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

export function createProject(db: Db, input: CreateProjectInput): Project {
  const now = new Date().toISOString();
  const uuid = randomUUID();
  const info = db
    .prepare(
      `INSERT INTO projects (uuid, name, description, type, status, stack, version, createdAt, updatedAt)
       VALUES (@uuid, @name, @description, @type, @status, @stack, @version, @createdAt, @updatedAt)`,
    )
    .run({
      uuid,
      name: input.name,
      description: input.description ?? "",
      type: input.type,
      status: input.status ?? "draft",
      stack: input.stack ?? "",
      version: input.version ?? "0.1.0",
      createdAt: now,
      updatedAt: now,
    });
  return getProject(db, Number(info.lastInsertRowid)) as Project;
}

export function updateProject(db: Db, id: number, patch: UpdateProjectInput): Project | undefined {
  const existing = getProject(db, id);
  if (!existing) return undefined;
  const merged = {
    name: patch.name ?? existing.name,
    description: patch.description ?? existing.description,
    type: patch.type ?? existing.type,
    status: patch.status ?? existing.status,
    stack: patch.stack ?? existing.stack,
    version: patch.version ?? existing.version,
    updatedAt: new Date().toISOString(),
    id,
  };
  db.prepare(
    `UPDATE projects SET name=@name, description=@description, type=@type, status=@status,
       stack=@stack, version=@version, updatedAt=@updatedAt WHERE id=@id`,
  ).run(merged);
  return getProject(db, id);
}

export function deleteProject(db: Db, id: number): boolean {
  const info = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return info.changes > 0;
}

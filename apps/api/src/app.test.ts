import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildApp } from "./app.js";
import { openDatabase } from "./db.js";
import { WorkspaceService } from "./services/workspace-service.js";

function makeWorkspace(): { service: WorkspaceService; root: string } {
  const root = mkdtempSync(join(tmpdir(), "telemax-ws-"));
  return { service: new WorkspaceService(root), root };
}

async function makeApp(workspace?: WorkspaceService): Promise<FastifyInstance> {
  const db = openDatabase(":memory:");
  return buildApp(undefined, { db, workspace: workspace ?? makeWorkspace().service });
}

describe("system routes", () => {
  it("GET /health returns ok", async () => {
    const app = await makeApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("ok");
    await app.close();
  });

  it("GET /version returns name and version", async () => {
    const app = await makeApp();
    const res = await app.inject({ method: "GET", url: "/version" });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("@telemax/api");
    await app.close();
  });

  it("GET /stats reads the live project count", async () => {
    const app = await makeApp();
    const before = await app.inject({ method: "GET", url: "/stats" });
    expect(before.json().projects).toBe(0);
    await app.inject({ method: "POST", url: "/projects", payload: { name: "P", type: "react" } });
    const after = await app.inject({ method: "GET", url: "/stats" });
    expect(after.json().projects).toBe(1);
    expect(after.json().packages).toBe(9);
    await app.close();
  });
});

describe("projects CRUD", () => {
  let app: FastifyInstance;
  beforeEach(async () => {
    app = await makeApp();
  });
  afterEach(async () => {
    await app.close();
  });

  it("creates and lists projects", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "TGMAX", type: "wordpress-news", description: "News portal" },
    });
    expect(create.statusCode).toBe(201);
    const created = create.json();
    expect(created.id).toBeGreaterThan(0);
    expect(typeof created.uuid).toBe("string");
    expect(created.status).toBe("draft");

    const list = await app.inject({ method: "GET", url: "/projects" });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toHaveLength(1);
  });

  it("searches and sorts", async () => {
    await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "Alpha", type: "react" },
    });
    await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "Beta", type: "flutter" },
    });
    const search = await app.inject({ method: "GET", url: "/projects?q=alph" });
    expect(search.json()).toHaveLength(1);
    const sorted = await app.inject({ method: "GET", url: "/projects?sort=name&order=asc" });
    expect(sorted.json()[0].name).toBe("Alpha");
  });

  it("gets a project by id and 404s when missing", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "X", type: "laravel" },
    });
    const id = create.json().id;
    const ok = await app.inject({ method: "GET", url: `/projects/${id}` });
    expect(ok.statusCode).toBe(200);
    const missing = await app.inject({ method: "GET", url: "/projects/99999" });
    expect(missing.statusCode).toBe(404);
  });

  it("updates a project", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "Old", type: "react" },
    });
    const id = create.json().id;
    const upd = await app.inject({
      method: "PUT",
      url: `/projects/${id}`,
      payload: { name: "New", status: "active" },
    });
    expect(upd.statusCode).toBe(200);
    expect(upd.json().name).toBe("New");
    expect(upd.json().status).toBe("active");
  });

  it("deletes a project", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "Del", type: "react" },
    });
    const id = create.json().id;
    const del = await app.inject({ method: "DELETE", url: `/projects/${id}` });
    expect(del.statusCode).toBe(204);
    const after = await app.inject({ method: "GET", url: `/projects/${id}` });
    expect(after.statusCode).toBe(404);
  });

  it("rejects invalid payloads with 400", async () => {
    const noName = await app.inject({
      method: "POST",
      url: "/projects",
      payload: { type: "react" },
    });
    expect(noName.statusCode).toBe(400);
    const badType = await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "Y", type: "cobol" },
    });
    expect(badType.statusCode).toBe(400);
  });
});

describe("workspace, archive and duplicate", () => {
  it("creates a real workspace with project.json on POST", async () => {
    const { service, root } = makeWorkspace();
    const app = await makeApp(service);
    const res = await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "TGMAX News", type: "wordpress-news", client: "Gruppo AIR" },
    });
    expect(res.statusCode).toBe(201);
    const project = res.json();
    expect(project.slug).toBe("tgmax-news");
    expect(project.workspace).toBe("workspace/tgmax-news");
    const base = join(root, "tgmax-news");
    for (const folder of ["docs", "assets", "prompts", "output", "logs", "uploads", "build"]) {
      expect(existsSync(join(base, folder))).toBe(true);
    }
    const manifest = JSON.parse(readFileSync(join(base, "project.json"), "utf8"));
    expect(manifest.uuid).toBe(project.uuid);
    expect(manifest.client).toBe("Gruppo AIR");
    await app.close();
  });

  it("archives a project via POST /projects/:id/archive", async () => {
    const app = await makeApp();
    const created = await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "Archive me", type: "react" },
    });
    const id = created.json().id;
    const res = await app.inject({ method: "POST", url: `/projects/${id}/archive` });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("archived");
    await app.close();
  });

  it("duplicates a project via POST /projects/:id/duplicate", async () => {
    const app = await makeApp();
    const created = await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "Original", type: "laravel", generator: "@telemax/generator-wordpress" },
    });
    const id = created.json().id;
    const res = await app.inject({ method: "POST", url: `/projects/${id}/duplicate` });
    expect(res.statusCode).toBe(201);
    const copy = res.json();
    expect(copy.name).toBe("Original (copy)");
    expect(copy.status).toBe("draft");
    expect(copy.generator).toBe("@telemax/generator-wordpress");
    expect(copy.id).not.toBe(id);
    await app.close();
  });
});

import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { openDatabase } from "../db.js";
import { WorkspaceService } from "../services/workspace-service.js";

async function makeApp(): Promise<FastifyInstance> {
  const db = openDatabase(":memory:");
  const workspace = new WorkspaceService(mkdtempSync(join(tmpdir(), "telemax-gen-")));
  return buildApp(undefined, { db, workspace });
}

async function createProject(app: FastifyInstance, payload: Record<string, unknown>): Promise<number> {
  const res = await app.inject({ method: "POST", url: "/projects", payload });
  return res.json().id;
}

describe("generation", () => {
  it("really generates a WordPress project and records files", async () => {
    const app = await makeApp();
    const id = await createProject(app, {
      name: "TGMAX",
      type: "wordpress-news",
      generator: "@telemax/generator-wordpress",
    });

    const gen = await app.inject({ method: "POST", url: `/projects/${id}/generate` });
    expect(gen.statusCode).toBe(201);
    const body = gen.json();
    expect(body.status).toBe("completed");
    expect(body.fileCount).toBeGreaterThan(0);
    expect(body.files.length).toBeGreaterThan(0);
    expect(body.files[0].sha256).toMatch(/^[0-9a-f]{64}$/);

    const status = await app.inject({ method: "GET", url: `/projects/${id}/generation` });
    expect(status.statusCode).toBe(200);
    expect(status.json().files.length).toBe(body.fileCount);

    const logs = await app.inject({ method: "GET", url: `/projects/${id}/logs` });
    const phases = logs.json().map((l: { phase: string }) => l.phase);
    expect(phases).toContain("generator");
    expect(phases).toContain("completed");
    await app.close();
  });

  it("fails cleanly when no runnable generator is installed", async () => {
    const app = await makeApp();
    const id = await createProject(app, { name: "Flutter app", type: "flutter" });
    const gen = await app.inject({ method: "POST", url: `/projects/${id}/generate` });
    expect(gen.statusCode).toBe(200);
    expect(gen.json().status).toBe("failed");
    expect(gen.json().error).toContain("No runnable generator");
    await app.close();
  });

  it("404s generation status for a project that never generated", async () => {
    const app = await makeApp();
    const id = await createProject(app, { name: "Empty", type: "react" });
    const res = await app.inject({ method: "GET", url: `/projects/${id}/generation` });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("serves the generated theme as a ZIP after generation", async () => {
    const app = await makeApp();
    const id = await createProject(app, {
      name: "TGMAX",
      type: "wordpress-news",
      generator: "@telemax/generator-wordpress",
    });

    // Before generation the archive does not exist.
    const before = await app.inject({ method: "GET", url: `/projects/${id}/download/theme` });
    expect(before.statusCode).toBe(404);

    await app.inject({ method: "POST", url: `/projects/${id}/generate` });

    const res = await app.inject({ method: "GET", url: `/projects/${id}/download/theme` });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("application/zip");
    expect(res.headers["content-disposition"]).toContain(".zip");
    // A valid ZIP starts with the "PK" local-file-header signature.
    const buf = res.rawPayload;
    expect(buf.length).toBeGreaterThan(0);
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
    await app.close();
  });
});

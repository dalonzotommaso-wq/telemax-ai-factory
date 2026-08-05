import { describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { openDatabase } from "../db.js";

async function makeApp(): Promise<FastifyInstance> {
  const db = openDatabase(":memory:");
  return buildApp(undefined, { db });
}

describe("system routes", () => {
  it("GET /system/status returns a real repository scan", async () => {
    const app = await makeApp();
    const res = await app.inject({ method: "GET", url: "/system/status" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.repository.name).toBe("@telemax/ai-factory");
    expect(body.counts.packages).toBe(9);
    expect(body.counts.apps).toBe(3);
    expect(body.counts.endpoints).toBeGreaterThan(0);
    expect(Array.isArray(body.packages)).toBe(true);
    await app.close();
  });

  it("GET /system/packages lists workspace packages", async () => {
    const app = await makeApp();
    const res = await app.inject({ method: "GET", url: "/system/packages" });
    expect(res.statusCode).toBe(200);
    const names = res.json().map((p: { name: string }) => p.name);
    expect(names).toContain("@telemax/core");
    await app.close();
  });

  it("GET /system/apps lists the three apps", async () => {
    const app = await makeApp();
    const res = await app.inject({ method: "GET", url: "/system/apps" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(3);
    await app.close();
  });

  it("GET /system/git exposes branch and changeset info", async () => {
    const app = await makeApp();
    const res = await app.inject({ method: "GET", url: "/system/git" });
    expect(res.statusCode).toBe(200);
    expect(typeof res.json().available).toBe("boolean");
    await app.close();
  });
});

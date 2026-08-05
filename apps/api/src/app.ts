import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { loadConfig, type ApiConfig } from "./config.js";
import { getDb, type Db } from "./db.js";
import { RepositoryService } from "./services/repository-service.js";
import { WorkspaceService } from "./services/workspace-service.js";
import { GenerationService } from "./services/generation-service.js";
import { healthRoutes } from "./routes/health.js";
import { versionRoutes } from "./routes/version.js";
import { projectRoutes } from "./routes/projects.js";
import { statsRoutes } from "./routes/stats.js";
import { systemRoutes } from "./routes/system.js";
import { generationRoutes } from "./routes/generation.js";

export interface BuildAppDeps {
  db?: Db;
  repository?: RepositoryService;
  workspace?: WorkspaceService;
  generation?: GenerationService;
}

export async function buildApp(
  config: ApiConfig = loadConfig(),
  deps: BuildAppDeps = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: config.logLevel } });

  app.decorate("db", deps.db ?? getDb());
  app.decorate("repository", deps.repository ?? new RepositoryService());
  const workspace = deps.workspace ?? new WorkspaceService();
  app.decorate("workspace", workspace);
  app.decorate("generation", deps.generation ?? new GenerationService(app.db, workspace));

  // Collect the live route table so the platform can report its own endpoint count.
  const routeList: { method: string; url: string }[] = [];
  app.decorate("routeList", routeList);
  app.addHook("onRoute", (route) => {
    const methods = Array.isArray(route.method) ? route.method : [route.method];
    for (const method of methods) routeList.push({ method, url: route.url });
  });

  await app.register(cors, { origin: config.corsOrigin });

  await app.register(swagger, {
    openapi: {
      info: { title: "Telemax AI Factory API", version: "0.1.0" },
      tags: [
        { name: "system", description: "System endpoints" },
        { name: "projects", description: "Project management" },
      ],
    },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  await app.register(healthRoutes);
  await app.register(versionRoutes);
  await app.register(statsRoutes);
  await app.register(systemRoutes);
  await app.register(projectRoutes);
  await app.register(generationRoutes);

  return app;
}

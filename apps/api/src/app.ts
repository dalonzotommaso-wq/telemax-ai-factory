import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { loadConfig, type ApiConfig } from "./config.js";
import { getDb, type Db } from "./db.js";
import { healthRoutes } from "./routes/health.js";
import { versionRoutes } from "./routes/version.js";
import { projectRoutes } from "./routes/projects.js";
import { statsRoutes } from "./routes/stats.js";

export interface BuildAppDeps {
  db?: Db;
}

export async function buildApp(
  config: ApiConfig = loadConfig(),
  deps: BuildAppDeps = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: config.logLevel } });

  app.decorate("db", deps.db ?? getDb());

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
  await app.register(projectRoutes);

  return app;
}

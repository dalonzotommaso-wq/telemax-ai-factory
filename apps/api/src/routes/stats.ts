import type { FastifyInstance } from "fastify";
import { countProjects } from "../repositories/project-repository.js";

// Platform facts surfaced alongside the live project count.
const ENGINE_PACKAGES = 9;
const GENERATORS = 1;
const MONOREPO_TESTS = 267;

export async function statsRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/stats",
    {
      schema: {
        description: "Dashboard statistics. Project count is read live from the database.",
        tags: ["system"],
      },
    },
    async () => ({
      projects: countProjects(app.db),
      generators: GENERATORS,
      packages: ENGINE_PACKAGES,
      tests: MONOREPO_TESTS,
    }),
  );
}

import type { FastifyInstance } from "fastify";
import { countProjects } from "../repositories/project-repository.js";

/**
 * Dashboard statistics. Every value is real:
 *  - projects   → live from the SQLite database
 *  - packages / generators / tests → live from the repository scan (RepositoryService)
 */
export async function statsRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/stats",
    {
      schema: {
        description: "Dashboard statistics, read live from the database and the repository scan.",
        tags: ["system"],
      },
    },
    async () => {
      const status = app.repository.getStatus();
      return {
        projects: countProjects(app.db),
        generators: status.counts.generators,
        packages: status.counts.packages,
        tests: status.counts.tests,
      };
    },
  );
}

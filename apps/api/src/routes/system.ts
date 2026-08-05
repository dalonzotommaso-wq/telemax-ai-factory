import type { FastifyInstance } from "fastify";

/**
 * System routes — expose the real repository scan performed by RepositoryService.
 * No static data: every field is read from the filesystem and git at request time.
 */
export async function systemRoutes(app: FastifyInstance): Promise<void> {
  const countEndpoints = (): number =>
    app.routeList.filter((r) => r.method !== "HEAD" && r.method !== "OPTIONS").length;

  app.get(
    "/system/status",
    {
      schema: {
        description: "Full repository status (packages, apps, generators, tests, build, git).",
        tags: ["system"],
      },
    },
    async () => app.repository.getStatus(countEndpoints()),
  );

  app.get(
    "/system/packages",
    {
      schema: { description: "Installed workspace packages (@telemax/*).", tags: ["system"] },
    },
    async () => app.repository.getPackages(),
  );

  app.get(
    "/system/apps",
    {
      schema: { description: "Runnable applications under apps/*.", tags: ["system"] },
    },
    async () => app.repository.getApps(),
  );

  app.get(
    "/system/git",
    {
      schema: { description: "Git status: branch, last commit, last tag, changesets.", tags: ["system"] },
    },
    async () => app.repository.getGit(),
  );
}

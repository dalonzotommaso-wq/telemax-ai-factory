import type { FastifyInstance } from "fastify";
import { getVersionInfo } from "../version.js";

export async function versionRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/version",
    {
      schema: {
        description: "Service name, version and Node runtime.",
        tags: ["system"],
        response: {
          200: {
            type: "object",
            properties: {
              name: { type: "string" },
              version: { type: "string" },
              node: { type: "string" },
            },
          },
        },
      },
    },
    async () => getVersionInfo(),
  );
}

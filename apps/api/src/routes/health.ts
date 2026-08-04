import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/health",
    {
      schema: {
        description: "Liveness/health probe.",
        tags: ["system"],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              uptime: { type: "number" },
            },
          },
        },
      },
    },
    async () => ({ status: "ok", uptime: process.uptime() }),
  );
}

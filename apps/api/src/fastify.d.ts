import "fastify";
import type { Db } from "./db.js";
import type { RepositoryService } from "./services/repository-service.js";
import type { WorkspaceService } from "./services/workspace-service.js";
import type { GenerationService } from "./services/generation-service.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Db;
    repository: RepositoryService;
    workspace: WorkspaceService;
    generation: GenerationService;
    routeList: { method: string; url: string }[];
  }
}

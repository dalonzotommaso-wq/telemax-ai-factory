import "fastify";
import type { Db } from "./db.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Db;
  }
}

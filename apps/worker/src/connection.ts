import { Redis } from "ioredis";
import { loadRedisConfig, type RedisConfig } from "./config.js";

/** Build an ioredis connection suitable for BullMQ (maxRetriesPerRequest must be null). */
export function createConnection(config: RedisConfig = loadRedisConfig()): Redis {
  return new Redis({
    host: config.host,
    port: config.port,
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });
}

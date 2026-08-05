export interface RedisConfig {
  readonly host: string;
  readonly port: number;
}

export function loadRedisConfig(env: NodeJS.ProcessEnv = process.env): RedisConfig {
  return {
    host: env["REDIS_HOST"] ?? "127.0.0.1",
    port: Number(env["REDIS_PORT"] ?? 6379),
  };
}

export const QUEUE_NAME = "telemax-generation";

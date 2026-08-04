export interface ApiConfig {
  readonly host: string;
  readonly port: number;
  readonly logLevel: string;
  readonly corsOrigin: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    host: env["API_HOST"] ?? "0.0.0.0",
    port: Number(env["API_PORT"] ?? env["PORT"] ?? 3001),
    logLevel: env["LOG_LEVEL"] ?? "info",
    corsOrigin: env["CORS_ORIGIN"] ?? "http://localhost:3000",
  };
}

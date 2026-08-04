import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);
  try {
    await app.listen({ host: config.host, port: config.port });
    app.log.info(`API listening on http://${config.host}:${config.port} (docs at /docs)`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void main();

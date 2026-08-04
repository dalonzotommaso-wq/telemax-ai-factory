import { createWorker } from "./worker.js";
import { QUEUE_NAME } from "./config.js";

function main(): void {
  const worker = createWorker();

  worker.on("ready", () => {
    console.log(`[worker] ready — listening on queue "${QUEUE_NAME}"`);
  });
  worker.on("completed", (job) => {
    console.log(`[worker] job ${job.id ?? "?"} completed`);
  });
  worker.on("failed", (job, err) => {
    console.error(`[worker] job ${job?.id ?? "?"} failed: ${err.message}`);
  });
  worker.on("error", (err) => {
    // Redis unavailable etc. — log and keep the process alive (BullMQ retries).
    console.warn(`[worker] connection error: ${err.message}`);
  });

  console.log(`[worker] bootstrap complete for queue "${QUEUE_NAME}"`);
}

main();

import { Worker } from "bullmq";
import { createConnection } from "./connection.js";
import { QUEUE_NAME } from "./config.js";
import { processGenerationJob, type GenerationJobData } from "./processor.js";

export function createWorker(): Worker<GenerationJobData> {
  return new Worker<GenerationJobData>(QUEUE_NAME, async (job) => processGenerationJob(job.data), {
    connection: createConnection(),
  });
}

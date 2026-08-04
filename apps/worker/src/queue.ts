import { Queue } from "bullmq";
import { createConnection } from "./connection.js";
import { QUEUE_NAME } from "./config.js";
import type { GenerationJobData } from "./processor.js";

export function createQueue(): Queue<GenerationJobData> {
  return new Queue<GenerationJobData>(QUEUE_NAME, { connection: createConnection() });
}

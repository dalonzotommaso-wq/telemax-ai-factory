export interface GenerationJobData {
  readonly generator: string;
  readonly siteName: string;
}

export interface GenerationJobResult {
  readonly generator: string;
  readonly siteName: string;
  readonly status: "accepted";
  readonly receivedAt: string;
}

/** Pure job handler — kept free of Redis so it can be unit-tested in isolation. */
export function processGenerationJob(data: GenerationJobData): GenerationJobResult {
  if (data.generator.length === 0 || data.siteName.length === 0) {
    throw new Error("generator and siteName are required");
  }
  return {
    generator: data.generator,
    siteName: data.siteName,
    status: "accepted",
    receivedAt: new Date().toISOString(),
  };
}

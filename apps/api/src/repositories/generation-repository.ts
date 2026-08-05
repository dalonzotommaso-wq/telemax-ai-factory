import type { Db } from "../db.js";

export type GenerationStatus = "running" | "completed" | "failed";

export interface Generation {
  id: number;
  projectId: number;
  generator: string;
  status: GenerationStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  fileCount: number;
  outputDir: string;
  error: string | null;
}

export interface GenerationLog {
  id: number;
  generationId: number;
  ts: string;
  level: "info" | "error";
  phase: string;
  message: string;
}

export interface GenerationFile {
  id: number;
  generationId: number;
  name: string;
  path: string;
  bytes: number;
  sha256: string;
  createdAt: string;
}

export function createGeneration(db: Db, projectId: number, generator: string): Generation {
  const info = db
    .prepare(
      `INSERT INTO generations (projectId, generator, status, startedAt, fileCount, outputDir)
       VALUES (@projectId, @generator, 'running', @startedAt, 0, '')`,
    )
    .run({ projectId, generator, startedAt: new Date().toISOString() });
  return getGeneration(db, Number(info.lastInsertRowid)) as Generation;
}

export function getGeneration(db: Db, id: number): Generation | undefined {
  return db.prepare("SELECT * FROM generations WHERE id = ?").get(id) as Generation | undefined;
}

export function latestGenerationForProject(db: Db, projectId: number): Generation | undefined {
  return db
    .prepare("SELECT * FROM generations WHERE projectId = ? ORDER BY id DESC LIMIT 1")
    .get(projectId) as Generation | undefined;
}

export function listGenerationsForProject(db: Db, projectId: number): Generation[] {
  return db
    .prepare("SELECT * FROM generations WHERE projectId = ? ORDER BY id DESC")
    .all(projectId) as Generation[];
}

export interface FinishGenerationInput {
  status: GenerationStatus;
  fileCount: number;
  outputDir: string;
  error?: string | null;
}

export function finishGeneration(db: Db, id: number, input: FinishGenerationInput): Generation {
  const gen = getGeneration(db, id);
  const finishedAt = new Date().toISOString();
  const durationMs = gen ? Date.parse(finishedAt) - Date.parse(gen.startedAt) : null;
  db.prepare(
    `UPDATE generations
       SET status=@status, finishedAt=@finishedAt, durationMs=@durationMs,
           fileCount=@fileCount, outputDir=@outputDir, error=@error
     WHERE id=@id`,
  ).run({
    id,
    status: input.status,
    finishedAt,
    durationMs,
    fileCount: input.fileCount,
    outputDir: input.outputDir,
    error: input.error ?? null,
  });
  return getGeneration(db, id) as Generation;
}

export function addLog(
  db: Db,
  generationId: number,
  phase: string,
  message: string,
  level: "info" | "error" = "info",
): void {
  db.prepare(
    `INSERT INTO generation_logs (generationId, ts, level, phase, message)
     VALUES (@generationId, @ts, @level, @phase, @message)`,
  ).run({ generationId, ts: new Date().toISOString(), level, phase, message });
}

export function listLogs(db: Db, generationId: number): GenerationLog[] {
  return db
    .prepare("SELECT * FROM generation_logs WHERE generationId = ? ORDER BY id ASC")
    .all(generationId) as GenerationLog[];
}

export function addFile(
  db: Db,
  generationId: number,
  file: { name: string; path: string; bytes: number; sha256: string },
): void {
  db.prepare(
    `INSERT INTO generation_files (generationId, name, path, bytes, sha256, createdAt)
     VALUES (@generationId, @name, @path, @bytes, @sha256, @createdAt)`,
  ).run({ generationId, ...file, createdAt: new Date().toISOString() });
}

export function listFiles(db: Db, generationId: number): GenerationFile[] {
  return db
    .prepare("SELECT * FROM generation_files WHERE generationId = ? ORDER BY path ASC")
    .all(generationId) as GenerationFile[];
}

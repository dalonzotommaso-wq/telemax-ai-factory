import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import Database from "better-sqlite3";

export type Db = Database.Database;

const here = dirname(fileURLToPath(import.meta.url));

export function defaultDbPath(): string {
  // Resolves to apps/api/data/telemax.db whether running from src (tsx) or dist.
  const dir = resolve(here, "..", "data");
  mkdirSync(dir, { recursive: true });
  return resolve(dir, "telemax.db");
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid          TEXT    NOT NULL UNIQUE,
  slug          TEXT    NOT NULL DEFAULT '',
  name          TEXT    NOT NULL,
  description   TEXT    NOT NULL DEFAULT '',
  client        TEXT    NOT NULL DEFAULT '',
  category      TEXT    NOT NULL DEFAULT '',
  type          TEXT    NOT NULL,
  stack         TEXT    NOT NULL DEFAULT '',
  generator     TEXT    NOT NULL DEFAULT '',
  workflow      TEXT    NOT NULL DEFAULT '',
  knowledgePack TEXT    NOT NULL DEFAULT '',
  aiProvider    TEXT    NOT NULL DEFAULT '',
  version       TEXT    NOT NULL DEFAULT '0.1.0',
  status        TEXT    NOT NULL DEFAULT 'draft',
  workspace     TEXT    NOT NULL DEFAULT '',
  createdAt     TEXT    NOT NULL,
  updatedAt     TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS generations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  projectId   INTEGER NOT NULL,
  generator   TEXT    NOT NULL DEFAULT '',
  status      TEXT    NOT NULL DEFAULT 'running',
  startedAt   TEXT    NOT NULL,
  finishedAt  TEXT,
  durationMs  INTEGER,
  fileCount   INTEGER NOT NULL DEFAULT 0,
  outputDir   TEXT    NOT NULL DEFAULT '',
  error       TEXT,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS generation_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  generationId  INTEGER NOT NULL,
  ts            TEXT    NOT NULL,
  level         TEXT    NOT NULL DEFAULT 'info',
  phase         TEXT    NOT NULL,
  message       TEXT    NOT NULL DEFAULT '',
  FOREIGN KEY (generationId) REFERENCES generations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS generation_files (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  generationId  INTEGER NOT NULL,
  name          TEXT    NOT NULL,
  path          TEXT    NOT NULL,
  bytes         INTEGER NOT NULL DEFAULT 0,
  sha256        TEXT    NOT NULL DEFAULT '',
  createdAt     TEXT    NOT NULL,
  FOREIGN KEY (generationId) REFERENCES generations(id) ON DELETE CASCADE
);
`;

// Columns added after the initial 0.1.0 schema — applied to pre-existing databases.
const MIGRATION_COLUMNS: Record<string, string> = {
  slug: "TEXT NOT NULL DEFAULT ''",
  client: "TEXT NOT NULL DEFAULT ''",
  category: "TEXT NOT NULL DEFAULT ''",
  generator: "TEXT NOT NULL DEFAULT ''",
  workflow: "TEXT NOT NULL DEFAULT ''",
  knowledgePack: "TEXT NOT NULL DEFAULT ''",
  aiProvider: "TEXT NOT NULL DEFAULT ''",
  workspace: "TEXT NOT NULL DEFAULT ''",
};

function migrate(db: Db): void {
  const cols = new Set(
    (db.prepare("PRAGMA table_info(projects)").all() as { name: string }[]).map((c) => c.name),
  );
  for (const [name, def] of Object.entries(MIGRATION_COLUMNS)) {
    if (!cols.has(name)) db.exec(`ALTER TABLE projects ADD COLUMN ${name} ${def}`);
  }
}

/** Open a database at the given path (":memory:" for tests) and ensure the schema. */
export function openDatabase(filename: string = defaultDbPath()): Db {
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

let singleton: Db | undefined;
export function getDb(): Db {
  singleton ??= openDatabase(process.env["TELEMAX_DB_PATH"] ?? defaultDbPath());
  return singleton;
}

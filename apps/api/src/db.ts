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
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  type        TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'draft',
  stack       TEXT    NOT NULL DEFAULT '',
  version     TEXT    NOT NULL DEFAULT '0.1.0',
  createdAt   TEXT    NOT NULL,
  updatedAt   TEXT    NOT NULL
);
`;

/** Open a database at the given path (":memory:" for tests) and ensure the schema. */
export function openDatabase(filename: string = defaultDbPath()): Db {
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

let singleton: Db | undefined;
export function getDb(): Db {
  singleton ??= openDatabase(process.env["TELEMAX_DB_PATH"] ?? defaultDbPath());
  return singleton;
}

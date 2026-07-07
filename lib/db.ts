import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

function init(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "sim-copilot.db"));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      scenario_text TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS objectives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id),
      ord INTEGER NOT NULL DEFAULT 0,
      text TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id),
      mode TEXT NOT NULL DEFAULT 'replay',
      phase TEXT NOT NULL DEFAULT 'prep',
      started_at TEXT DEFAULT (datetime('now','localtime')),
      ended_at TEXT
    );
    CREATE TABLE IF NOT EXISTS timeline_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      phase TEXT NOT NULL,
      start_ts TEXT NOT NULL,
      end_ts TEXT,
      transcript_text TEXT DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'speech',
      meta TEXT DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      kind TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_segments_session ON timeline_segments(session_id, id);
  `);
  return db;
}

// caché en globalThis: sobrevive el hot-reload del dev server
const g = globalThis as unknown as { __simdb?: Database.Database };
export const db: Database.Database = g.__simdb ?? (g.__simdb = init());

export function nowTs(): string {
  return new Date().toISOString();
}

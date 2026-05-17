import Database from "@tauri-apps/plugin-sql";

const DB_PATH = "sqlite:whispr.db";

let dbPromise: Promise<Database> | null = null;

export function getDatabase(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load(DB_PATH).then(async (db) => {
      await runMigrations(db);
      return db;
    });
  }
  return dbPromise;
}

async function runMigrations(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transcription_jobs (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      source_type TEXT NOT NULL CHECK(source_type IN ('local', 'url')),
      source_path TEXT,
      source_url TEXT,
      file_size INTEGER,
      duration TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
      transcript TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

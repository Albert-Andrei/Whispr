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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await safeAlter(db, "ALTER TABLE transcription_jobs ADD COLUMN error_message TEXT;");
  await safeAlter(db, "ALTER TABLE transcription_jobs ADD COLUMN progress REAL DEFAULT 0;");
  await safeAlter(db, "ALTER TABLE transcription_jobs ADD COLUMN pipeline_stage TEXT;");
  await safeAlter(db, "ALTER TABLE transcription_jobs ADD COLUMN srt_output TEXT;");
  await safeAlter(db, "ALTER TABLE transcription_jobs ADD COLUMN model_used TEXT;");
  await safeAlter(db, "ALTER TABLE transcription_jobs ADD COLUMN translated_text TEXT;");
  await safeAlter(db, "ALTER TABLE transcription_jobs ADD COLUMN translated_lang TEXT;");
}

async function safeAlter(db: Database, sql: string): Promise<void> {
  try {
    await db.execute(sql);
  } catch {
    /* column may already exist */
  }
}

export async function getConfig(key: string): Promise<string | null> {
  const db = await getDatabase();
  const rows = await db.select<{ value: string }[]>(
    "SELECT value FROM app_config WHERE key = $1",
    [key],
  );
  const row = rows[0];
  return row?.value ?? null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO app_config (key, value, updated_at) VALUES ($1, $2, $3)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, now],
  );
}

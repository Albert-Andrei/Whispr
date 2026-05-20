import Database from "@tauri-apps/plugin-sql";

const DB_PATH = "sqlite:whispr.db";

const SCHEMA_VERSION_KEY = "db_schema_version";
const LATEST_SCHEMA_VERSION = 5;

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

type Migration = {
  version: number;
  up: (db: Database) => Promise<void>;
};

const migrations: Migration[] = [
  {
    version: 1,
    up: async (db) => {
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
    },
  },
  {
    version: 2,
    up: async (db) => {
      await alterColumn(db, "ALTER TABLE transcription_jobs ADD COLUMN error_message TEXT;");
      await alterColumn(db, "ALTER TABLE transcription_jobs ADD COLUMN progress REAL DEFAULT 0;");
      await alterColumn(db, "ALTER TABLE transcription_jobs ADD COLUMN pipeline_stage TEXT;");
      await alterColumn(db, "ALTER TABLE transcription_jobs ADD COLUMN srt_output TEXT;");
      await alterColumn(db, "ALTER TABLE transcription_jobs ADD COLUMN model_used TEXT;");
    },
  },
  {
    version: 3,
    up: async (db) => {
      await alterColumn(db, "ALTER TABLE transcription_jobs ADD COLUMN translated_text TEXT;");
      await alterColumn(db, "ALTER TABLE transcription_jobs ADD COLUMN translated_lang TEXT;");
    },
  },
  {
    version: 4,
    up: async (db) => {
      await alterColumn(db, "ALTER TABLE transcription_jobs ADD COLUMN audio_path TEXT;");
    },
  },
  {
    version: 5,
    up: migrateRecordSourceType,
  },
];

async function runMigrations(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  let version = await getSchemaVersion(db);

  for (const migration of migrations) {
    if (migration.version <= version) continue;
    await migration.up(db);
    await setSchemaVersion(db, migration.version);
    version = migration.version;
  }
}

async function getSchemaVersion(db: Database): Promise<number> {
  const rows = await db.select<{ value: string }[]>(
    "SELECT value FROM app_config WHERE key = $1",
    [SCHEMA_VERSION_KEY],
  );
  const stored = rows[0]?.value;
  if (stored != null) {
    const parsed = parseInt(stored, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const inferred = await inferSchemaVersion(db);
  if (inferred > 0) {
    await setSchemaVersion(db, inferred);
  }
  return inferred;
}

async function inferSchemaVersion(db: Database): Promise<number> {
  const tables = await db.select<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('transcription_jobs', 'app_config')",
  );
  const tableNames = new Set(tables.map((t) => t.name));
  if (!tableNames.has("transcription_jobs") || !tableNames.has("app_config")) {
    return 0;
  }

  const cols = await db.select<{ name: string }[]>("PRAGMA table_info(transcription_jobs)");
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has("error_message")) return 1;
  if (!colNames.has("translated_text")) return 2;
  if (!colNames.has("audio_path")) return 3;

  const ddlRows = await db.select<{ sql: string }[]>(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'transcription_jobs'",
  );
  const ddl = ddlRows[0]?.sql ?? "";
  if (!ddl.includes("'record'")) return 4;

  return LATEST_SCHEMA_VERSION;
}

async function setSchemaVersion(db: Database, version: number): Promise<void> {
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO app_config (key, value, updated_at) VALUES ($1, $2, $3)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [SCHEMA_VERSION_KEY, String(version), now],
  );
}

async function migrateRecordSourceType(db: Database): Promise<void> {
  const rows = await db.select<{ sql: string }[]>(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'transcription_jobs'",
  );
  const ddl = rows[0]?.sql ?? "";
  if (ddl.includes("'record'")) return;

  await db.execute("PRAGMA foreign_keys = OFF;");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transcription_jobs_new (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      source_type TEXT NOT NULL CHECK(source_type IN ('local', 'url', 'record')),
      source_path TEXT,
      source_url TEXT,
      file_size INTEGER,
      duration TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
      transcript TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      error_message TEXT,
      progress REAL DEFAULT 0,
      pipeline_stage TEXT,
      srt_output TEXT,
      model_used TEXT,
      translated_text TEXT,
      translated_lang TEXT,
      audio_path TEXT
    );
  `);
  await db.execute(`
    INSERT INTO transcription_jobs_new (
      id, filename, source_type, source_path, source_url, file_size, duration,
      status, transcript, created_at, updated_at, error_message, progress,
      pipeline_stage, srt_output, model_used, translated_text, translated_lang, audio_path
    )
    SELECT
      id, filename, source_type, source_path, source_url, file_size, duration,
      status, transcript, created_at, updated_at, error_message, progress,
      pipeline_stage, srt_output, model_used, translated_text, translated_lang, audio_path
    FROM transcription_jobs;
  `);
  await db.execute("DROP TABLE transcription_jobs;");
  await db.execute("ALTER TABLE transcription_jobs_new RENAME TO transcription_jobs;");
  await db.execute("PRAGMA foreign_keys = ON;");
}

async function alterColumn(db: Database, sql: string): Promise<void> {
  try {
    await db.execute(sql);
  } catch {
    /* column may already exist on partially migrated legacy DBs */
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

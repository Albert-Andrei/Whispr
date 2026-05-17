import type { JobStatus, NewJobInput, SourceType, TranscriptionJob } from "./types";
import { getDatabase } from "../../lib/db";

type JobRow = {
  id: string;
  filename: string;
  source_type: SourceType;
  source_path: string | null;
  source_url: string | null;
  file_size: number | null;
  duration: string | null;
  status: JobStatus;
  transcript: string | null;
  created_at: string;
  updated_at: string;
};

function rowToJob(row: JobRow): TranscriptionJob {
  return { ...row };
}

export async function listJobs(): Promise<TranscriptionJob[]> {
  const db = await getDatabase();
  const rows = await db.select<JobRow[]>(
    "SELECT * FROM transcription_jobs ORDER BY datetime(created_at) DESC",
  );
  return rows.map(rowToJob);
}

export async function insertJob(input: NewJobInput): Promise<TranscriptionJob> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.execute(
    `INSERT INTO transcription_jobs (
      id, filename, source_type, source_path, source_url,
      file_size, duration, status, transcript, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      input.filename,
      input.source_type,
      input.source_path ?? null,
      input.source_url ?? null,
      input.file_size ?? null,
      input.duration ?? null,
      input.status ?? "pending",
      input.transcript ?? null,
      createdAt,
      createdAt,
    ],
  );
  const rows = await db.select<JobRow[]>(
    "SELECT * FROM transcription_jobs WHERE id = $1",
    [id],
  );
  const row = rows[0];
  if (!row) {
    throw new Error("Failed to read inserted job");
  }
  return rowToJob(row);
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    "UPDATE transcription_jobs SET status = $1, updated_at = $2 WHERE id = $3",
    [status, new Date().toISOString(), id],
  );
}

export async function deleteJob(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM transcription_jobs WHERE id = $1", [id]);
}

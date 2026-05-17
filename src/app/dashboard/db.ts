import type { JobStatus, NewJobInput, PipelineStage, SourceType, TranscriptionJob } from "./types";
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
  error_message: string | null;
  progress: number | null;
  pipeline_stage: string | null;
  srt_output: string | null;
  model_used: string | null;
};

function rowToJob(row: JobRow): TranscriptionJob {
  const stage = row.pipeline_stage as PipelineStage | null;
  return {
    ...row,
    error_message: row.error_message ?? null,
    progress: row.progress ?? 0,
    pipeline_stage:
      stage === "downloading" || stage === "extracting" || stage === "transcribing"
        ? stage
        : null,
    srt_output: row.srt_output ?? null,
    model_used: row.model_used ?? null,
  };
}

export async function getJobById(id: string): Promise<TranscriptionJob | null> {
  const db = await getDatabase();
  const rows = await db.select<JobRow[]>(
    "SELECT * FROM transcription_jobs WHERE id = $1",
    [id],
  );
  const row = rows[0];
  return row ? rowToJob(row) : null;
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
      file_size, duration, status, transcript, created_at, updated_at,
      error_message, progress, pipeline_stage, srt_output, model_used
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
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
      null,
      0,
      null,
      null,
      null,
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

export async function updateJobProgress(
  id: string,
  progress: number,
  pipelineStage: PipelineStage | null,
): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `UPDATE transcription_jobs SET progress = $1, pipeline_stage = $2, updated_at = $3 WHERE id = $4`,
    [progress, pipelineStage, new Date().toISOString(), id],
  );
}

export async function updateJobTranscript(
  id: string,
  transcript: string,
  srtOutput: string | null,
  modelUsed: string | null,
  duration: string | null,
): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `UPDATE transcription_jobs SET transcript = $1, srt_output = $2, model_used = $3, duration = COALESCE($4, duration), status = 'completed', progress = 1, pipeline_stage = NULL, error_message = NULL, updated_at = $5 WHERE id = $6`,
    [transcript, srtOutput, modelUsed, duration, new Date().toISOString(), id],
  );
}

export async function updateJobError(
  id: string,
  errorMessage: string,
): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `UPDATE transcription_jobs SET status = 'failed', error_message = $1, updated_at = $2 WHERE id = $3`,
    [errorMessage, new Date().toISOString(), id],
  );
}

export async function resetJobForRetry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `UPDATE transcription_jobs SET status = 'pending', error_message = NULL, progress = 0, pipeline_stage = NULL, transcript = NULL, srt_output = NULL, updated_at = $1 WHERE id = $2`,
    [new Date().toISOString(), id],
  );
}

export async function updateJobProcessingStart(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `UPDATE transcription_jobs SET status = 'processing', progress = 0, pipeline_stage = NULL, error_message = NULL, updated_at = $1 WHERE id = $2`,
    [new Date().toISOString(), id],
  );
}

export async function deleteJob(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM transcription_jobs WHERE id = $1", [id]);
}

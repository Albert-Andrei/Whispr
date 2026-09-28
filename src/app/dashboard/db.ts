import type { ClipRange, JobStatus, NewJobInput, PipelineStage, SourceType, TranscriptionJob } from "./types";
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
  audio_path: string | null;
  translated_text: string | null;
  translated_lang: string | null;
  clip_start_ms: number | null;
  clip_end_ms: number | null;
  draft: number | null;
};

function rowToJob(row: JobRow): TranscriptionJob {
  const stage = row.pipeline_stage as PipelineStage | null;
  return {
    ...row,
    error_message: row.error_message ?? null,
    progress: row.progress ?? 0,
    pipeline_stage:
      stage === "fetching" || stage === "downloading" || stage === "extracting" || stage === "transcribing"
        ? stage
        : null,
    srt_output: row.srt_output ?? null,
    model_used: row.model_used ?? null,
    audio_path: row.audio_path ?? null,
    translated_text: row.translated_text ?? null,
    translated_lang: row.translated_lang ?? null,
    clip_start_ms: row.clip_start_ms ?? null,
    clip_end_ms: row.clip_end_ms ?? null,
    draft: row.draft === 1,
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
    "SELECT * FROM transcription_jobs WHERE source_type != 'record' ORDER BY datetime(created_at) DESC",
  );
  return rows.map(rowToJob);
}

export async function insertJob(input: NewJobInput): Promise<TranscriptionJob> {
  const db = await getDatabase();
  const id = input.id ?? crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.execute(
    `INSERT INTO transcription_jobs (
      id, filename, source_type, source_path, source_url,
      file_size, duration, status, transcript, created_at, updated_at,
      error_message, progress, pipeline_stage, srt_output, model_used, audio_path,
      clip_start_ms, clip_end_ms, draft
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
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
      input.srt_output ?? null,
      null,
      input.audio_path ?? null,
      input.clip ? Math.round(input.clip.startMs) : null,
      input.clip ? Math.round(input.clip.endMs) : null,
      input.draft ? 1 : 0,
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

/** Confirms a draft from the clip editor: stores its section and makes it queueable. */
export async function startDraftJob(
  id: string,
  clip: ClipRange | null,
  filename: string | null,
): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `UPDATE transcription_jobs SET draft = 0, status = 'pending', clip_start_ms = $1, clip_end_ms = $2,
      filename = COALESCE($3, filename), updated_at = $4 WHERE id = $5`,
    [
      clip ? Math.round(clip.startMs) : null,
      clip ? Math.round(clip.endMs) : null,
      filename,
      new Date().toISOString(),
      id,
    ],
  );
}

export async function updateJobDuration(id: string, duration: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    "UPDATE transcription_jobs SET duration = $1, updated_at = $2 WHERE id = $3",
    [duration, new Date().toISOString(), id],
  );
}

export async function updateJobFilename(id: string, filename: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    "UPDATE transcription_jobs SET filename = $1, updated_at = $2 WHERE id = $3",
    [filename, new Date().toISOString(), id],
  );
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

export async function setJobTranslation(
  id: string,
  translatedText: string,
  translatedLang: string,
): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `UPDATE transcription_jobs SET translated_text = $1, translated_lang = $2, updated_at = $3 WHERE id = $4`,
    [translatedText, translatedLang, new Date().toISOString(), id],
  );
}

export async function clearJobTranslation(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `UPDATE transcription_jobs SET translated_text = NULL, translated_lang = NULL, updated_at = $1 WHERE id = $2`,
    [new Date().toISOString(), id],
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
    `UPDATE transcription_jobs SET status = 'pending', error_message = NULL, progress = 0, pipeline_stage = NULL, transcript = NULL, srt_output = NULL, audio_path = NULL, translated_text = NULL, translated_lang = NULL, updated_at = $1 WHERE id = $2`,
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

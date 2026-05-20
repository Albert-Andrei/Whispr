import type { JobStatus, PipelineStage, TranscriptionJob } from "../dashboard/types";
import { getDatabase } from "../../lib/db";

type JobRow = {
  id: string;
  filename: string;
  source_type: string;
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
};

function rowToJob(row: JobRow): TranscriptionJob {
  return {
    ...row,
    source_type: "record",
    error_message: row.error_message ?? null,
    progress: row.progress ?? 0,
    pipeline_stage:
      row.pipeline_stage === "downloading" ||
      row.pipeline_stage === "extracting" ||
      row.pipeline_stage === "transcribing"
        ? (row.pipeline_stage as PipelineStage)
        : null,
    srt_output: row.srt_output ?? null,
    model_used: row.model_used ?? null,
    audio_path: row.audio_path ?? null,
    translated_text: row.translated_text ?? null,
    translated_lang: row.translated_lang ?? null,
  };
}

export async function listRecordJobs(): Promise<TranscriptionJob[]> {
  const db = await getDatabase();
  const rows = await db.select<JobRow[]>(
    "SELECT * FROM transcription_jobs WHERE source_type = 'record' ORDER BY datetime(created_at) DESC",
  );
  return rows.map(rowToJob);
}

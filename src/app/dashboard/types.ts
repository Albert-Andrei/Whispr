export type JobStatus = "pending" | "processing" | "completed" | "failed";
export type SourceType = "local" | "url" | "record";
export type PipelineStage = "fetching" | "downloading" | "extracting" | "transcribing";

export interface TranscriptionJob {
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
  progress: number;
  pipeline_stage: PipelineStage | null;
  srt_output: string | null;
  model_used: string | null;
  audio_path: string | null;
  translated_text: string | null;
  translated_lang: string | null;
  /** Live progress within the current pipeline stage (from events only, not stored). */
  stage_progress?: number;
}

/** `error_message` of a job the user cancelled; it is stored as failed so it can be retried. */
export const CANCELLED_ERROR = "Cancelled";

export function isCancelledJob(job: Pick<TranscriptionJob, "status" | "error_message">): boolean {
  return job.status === "failed" && job.error_message === CANCELLED_ERROR;
}

export type NewJobInput = {
  id?: string;
  filename: string;
  source_type: SourceType;
  source_path?: string | null;
  source_url?: string | null;
  file_size?: number | null;
  duration?: string | null;
  status?: JobStatus;
  transcript?: string | null;
  audio_path?: string | null;
  srt_output?: string | null;
};

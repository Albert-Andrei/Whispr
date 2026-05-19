export type JobStatus = "pending" | "processing" | "completed" | "failed";
export type SourceType = "local" | "url";
export type PipelineStage = "downloading" | "extracting" | "transcribing";

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
  translated_text: string | null;
  translated_lang: string | null;
}

export type NewJobInput = {
  filename: string;
  source_type: SourceType;
  source_path?: string | null;
  source_url?: string | null;
  file_size?: number | null;
  duration?: string | null;
  status?: JobStatus;
  transcript?: string | null;
};

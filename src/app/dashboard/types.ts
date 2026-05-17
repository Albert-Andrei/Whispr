export type JobStatus = "pending" | "processing" | "completed" | "failed";
export type SourceType = "local" | "url";

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

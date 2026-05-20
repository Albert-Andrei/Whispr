export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "installing"
  | "up-to-date"
  | "error";

export type AppUpdateState = {
  status: UpdateStatus;
  currentVersion: string;
  latestVersion: string | null;
  downloadProgress: number;
  error: string | null;
};

export type BinaryInfo = {
  id: string;
  label: string;
  ok: boolean;
  version: string | null;
  path: string | null;
  sizeBytes: number | null;
  role: string;
};

export type BinaryHealthReport = {
  ffmpeg: BinaryInfo;
  ytdlp: BinaryInfo;
  whisper: BinaryInfo;
};

export type DiskCategory = {
  id: string;
  label: string;
  bytes: number;
};

export type DiskUsageReport = {
  categories: DiskCategory[];
  totalBytes: number;
};

export type AppUpdateInfo = {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  releaseUrl: string | null;
  releaseName: string | null;
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

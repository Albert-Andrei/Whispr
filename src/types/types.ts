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

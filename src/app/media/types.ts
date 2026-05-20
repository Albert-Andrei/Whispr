export type PlaybackMediaItem = {
  jobId: string;
  path: string;
  filename: string;
  sourceType: string | null;
  bytes: number;
  hasSyncedPlayback: boolean;
};

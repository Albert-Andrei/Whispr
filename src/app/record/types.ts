import type { TranscriptionJob } from "../dashboard/types";

export type RecordSessionState = "idle" | "recording" | "paused";

export type LiveSegment = {
  startMs: number;
  endMs: number;
  text: string;
};

export type RecordLevelEvt = {
  sessionId: string;
  level: number;
};

export type RecordSegmentEvt = {
  sessionId: string;
  startMs: number;
  endMs: number;
  text: string;
};

export type RecordStateEvt = {
  sessionId: string;
  state: "recording" | "paused" | "stopped" | "discarded";
};

export type RecordStopResult = {
  jobId: string;
  filename: string;
  sourcePath: string;
  audioPath: string;
  tailSegments: LiveSegment[];
};

export function mergeSegments(
  existing: LiveSegment[],
  tail: LiveSegment[],
): LiveSegment[] {
  const map = new Map<number, LiveSegment>();
  for (const seg of existing) {
    map.set(seg.startMs, seg);
  }
  for (const seg of tail) {
    map.set(seg.startMs, seg);
  }
  return [...map.values()].sort((a, b) => a.startMs - b.startMs);
}

export type RecordJob = TranscriptionJob;

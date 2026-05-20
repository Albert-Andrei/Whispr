import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import type { PipelineStage, TranscriptionJob } from "../dashboard/types";
import { insertJob } from "../dashboard/db";
import { useTranscriptionStore } from "../dashboard/store";
import { listRecordJobs } from "./db";
import { showAppToast } from "../../lib/toastManager";
import type {
  LiveSegment,
  RecordLevelEvt,
  RecordSegmentEvt,
  RecordSessionState,
  RecordStateEvt,
  RecordStopResult,
} from "./types";
import { mergeSegments } from "./types";

type RecordStoreState = {
  jobs: TranscriptionJob[];
  ready: boolean;
  error: string | null;
  selectedJobId: string | null;
  sessionId: string | null;
  sessionState: RecordSessionState;
  elapsedMs: number;
  liveSegments: LiveSegment[];
  level: number;
  listenersReady: boolean;
  navPromptOpen: boolean;
  pendingNavView: "history" | "settings" | "media" | null;

  loadJobs: () => Promise<void>;
  setSelectedJob: (id: string | null) => void;
  initRecordListeners: () => Promise<void>;
  startRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  discardRecording: () => Promise<void>;
  patchJob: (id: string, patch: Partial<TranscriptionJob>) => void;
  requestNavigation: (view: "history" | "settings" | "media") => boolean;
  closeNavPrompt: () => void;
  confirmNavStop: () => Promise<void>;
  confirmNavDiscard: () => Promise<void>;
};

function liveSegmentsToSrt(segments: LiveSegment[]): string {
  return segments
    .map((seg, i) => {
      const start = formatSrtTime(seg.startMs);
      const end = formatSrtTime(seg.endMs);
      return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join("\n");
}

function formatSrtTime(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const rem = ms % 1000;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${rem.toString().padStart(3, "0")}`;
}

export const useRecordStore = create<RecordStoreState>((set, get) => ({
  jobs: [],
  ready: false,
  error: null,
  selectedJobId: null,
  sessionId: null,
  sessionState: "idle",
  elapsedMs: 0,
  liveSegments: [],
  level: 0,
  listenersReady: false,
  navPromptOpen: false,
  pendingNavView: null,

  loadJobs: async () => {
    if (!isTauri()) {
      set({ ready: true, error: "Recording requires the desktop app." });
      return;
    }
    try {
      const jobs = await listRecordJobs();
      set({ jobs, ready: true, error: null });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load recordings",
        ready: true,
      });
    }
  },

  setSelectedJob: (id) => set({ selectedJobId: id }),

  initRecordListeners: async () => {
    if (get().listenersReady || !isTauri()) return;

    await listen<RecordLevelEvt>("record:level", (ev) => {
      const { sessionId } = get();
      if (ev.payload.sessionId !== sessionId) return;
      set({ level: ev.payload.level });
    });

    await listen<RecordSegmentEvt>("record:segment", (ev) => {
      const { sessionId } = get();
      if (ev.payload.sessionId !== sessionId) return;
      set((s) => ({
        liveSegments: [
          ...s.liveSegments,
          {
            startMs: ev.payload.startMs,
            endMs: ev.payload.endMs,
            text: ev.payload.text,
          },
        ],
      }));
    });

    await listen<RecordStateEvt>("record:state", (ev) => {
      const { sessionId } = get();
      if (ev.payload.sessionId !== sessionId) return;
      if (ev.payload.state === "discarded") {
        set({
          sessionId: null,
          sessionState: "idle",
          liveSegments: [],
          level: 0,
          elapsedMs: 0,
        });
      }
    });

    await listen<{ jobId: string; stage: string; percent: number }>(
      "pipeline:progress",
      (ev) => {
        const p = ev.payload;
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === p.jobId
              ? {
                  ...j,
                  status: "processing",
                  pipeline_stage: p.stage as PipelineStage,
                  progress: p.percent,
                }
              : j,
          ),
        }));
        if (p.percent >= 1) {
          void get().loadJobs();
        }
      },
    );

    set({ listenersReady: true });
  },

  startRecording: async () => {
    if (!isTauri()) return;
    const result = await invoke<{ sessionId: string }>("record_start");
    set({
      sessionId: result.sessionId,
      sessionState: "recording",
      liveSegments: [],
      level: 0,
      elapsedMs: 0,
      selectedJobId: null,
      error: null,
    });
  },

  pauseRecording: async () => {
    if (!isTauri()) return;
    await invoke("record_pause");
    set({ sessionState: "paused" });
  },

  resumeRecording: async () => {
    if (!isTauri()) return;
    await invoke("record_resume");
    set({ sessionState: "recording" });
  },

  stopRecording: async () => {
    if (!isTauri()) return;
    const existingSegments = get().liveSegments;
    let result: RecordStopResult;
    try {
      result = await invoke<RecordStopResult>("record_stop", {
        filename: null,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save recording";
      set({ error: message });
      throw err;
    }

    const tailSegments: LiveSegment[] = (result.tailSegments ?? []).map((s) => ({
      startMs: s.startMs,
      endMs: s.endMs,
      text: s.text,
    }));
    const liveSegments = mergeSegments(existingSegments, tailSegments);
    const liveSrt = liveSegmentsToSrt(liveSegments);
    const liveText = liveSegments.map((s) => s.text).join(" ");

    const job = await insertJob({
      id: result.jobId,
      filename: result.filename,
      source_type: "record",
      source_path: result.sourcePath,
      audio_path: result.audioPath,
      status: "pending",
      transcript: liveText || null,
      srt_output: liveSrt || null,
    });

    set((s) => ({
      jobs: [job, ...s.jobs.filter((j) => j.id !== job.id)],
      sessionId: null,
      sessionState: "idle",
      liveSegments: [],
      level: 0,
      selectedJobId: result.jobId,
      navPromptOpen: false,
      pendingNavView: null,
    }));

    showAppToast("Recording saved");

    useTranscriptionStore.getState().enqueueExternalPipeline(result.jobId);
    void useTranscriptionStore.getState().processPipelineQueue();
    void get().loadJobs();
  },

  discardRecording: async () => {
    if (!isTauri()) return;
    await invoke("record_discard");
    set({
      sessionId: null,
      sessionState: "idle",
      liveSegments: [],
      level: 0,
      elapsedMs: 0,
      navPromptOpen: false,
      pendingNavView: null,
    });
  },

  patchJob: (id, patch) => {
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    }));
  },

  requestNavigation: (view) => {
    const { sessionState } = get();
    if (sessionState === "idle") return true;
    set({ navPromptOpen: true, pendingNavView: view });
    return false;
  },

  closeNavPrompt: () => set({ navPromptOpen: false, pendingNavView: null }),

  confirmNavStop: async () => {
    const pending = get().pendingNavView;
    await get().stopRecording();
    set({ navPromptOpen: false, pendingNavView: null });
    if (pending) {
      window.dispatchEvent(
        new CustomEvent("whispr:navigate", { detail: pending }),
      );
    }
  },

  confirmNavDiscard: async () => {
    const pending = get().pendingNavView;
    await get().discardRecording();
    set({ navPromptOpen: false, pendingNavView: null });
    if (pending) {
      window.dispatchEvent(
        new CustomEvent("whispr:navigate", { detail: pending }),
      );
    }
  },
}));

export function isRecordSessionActive(): boolean {
  return useRecordStore.getState().sessionState !== "idle";
}

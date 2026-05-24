import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import i18n from "../../lib/i18n";
import type { PipelineStage, TranscriptionJob } from "./types";
import {
  deleteJob,
  getJobById,
  insertJob,
  listJobs,
  resetJobForRetry,
  updateJobFilename,
} from "./db";
import { getConfig, setConfig } from "../../lib/db";
import { isRecordSessionActive, useRecordStore } from "../record/store";

export type PipelineProgressEvt = {
  jobId: string;
  stage: string;
  percent: number;
};

type TranscriptionState = {
  jobs: TranscriptionJob[];
  ready: boolean;
  error: string | null;
  selectedJobId: string | null;
  pipelineQueue: string[];
  activePipelines: number;
  maxConcurrent: number;
  listenersReady: boolean;

  loadJobs: () => Promise<void>;
  setSelectedJob: (id: string | null) => void;
  addLocalFiles: (files: File[]) => Promise<void>;
  addLocalFilePaths: (paths: string[]) => Promise<void>;
  addUrlImport: (url: string) => Promise<void>;
  retryJob: (id: string) => Promise<void>;
  removeJob: (id: string) => Promise<void>;
  renameJob: (id: string, filename: string) => Promise<void>;
  patchJob: (id: string, patch: Partial<TranscriptionJob>) => void;
  initPipelineListeners: () => Promise<void>;
  refreshMaxConcurrent: () => Promise<void>;
  setMaxConcurrentJobs: (n: number) => Promise<void>;
  enqueuePipeline: (jobId: string) => void;
  enqueueExternalPipeline: (jobId: string) => void;
  processPipelineQueue: () => Promise<void>;
};

function urlDisplayName(url: string): string {
  try {
    const u = new URL(url.trim());
    return u.hostname.replace(/^www\./, "") || url.slice(0, 64);
  } catch {
    return url.trim().slice(0, 80);
  }
}

function filePathIfAvailable(file: File): string | null {
  const path = (file as File & { path?: string }).path;
  if (typeof path === "string" && path.length > 0) return path;
  return null;
}

function basenameFromFsPath(p: string): string {
  const normalized = p.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx >= 0 ? normalized.slice(idx + 1) || normalized : normalized;
}

async function recommendedMaxConcurrent(): Promise<number> {
  try {
    const n = await invoke<number>("get_recommended_max_concurrent");
    return Math.min(3, Math.max(1, n));
  } catch {
    return 1;
  }
}

export const useTranscriptionStore = create<TranscriptionState>((set, get) => ({
  jobs: [],
  ready: false,
  error: null,
  selectedJobId: null,
  pipelineQueue: [],
  activePipelines: 0,
  maxConcurrent: 1,
  listenersReady: false,

  refreshMaxConcurrent: async () => {
    const raw = await getConfig("max_concurrent_jobs");
    if (raw) {
      const n = Number.parseInt(raw, 10);
      if (Number.isFinite(n)) {
        set({ maxConcurrent: Math.min(3, Math.max(1, n)) });
        return;
      }
    }
    const def = await recommendedMaxConcurrent();
    set({ maxConcurrent: def });
    await setConfig("max_concurrent_jobs", String(def));
  },

  setMaxConcurrentJobs: async (n: number) => {
    const v = Math.min(3, Math.max(1, Math.round(n)));
    await setConfig("max_concurrent_jobs", String(v));
    set({ maxConcurrent: v });
    await get().processPipelineQueue();
  },

  initPipelineListeners: async () => {
    if (get().listenersReady || !isTauri()) return;
    await listen<PipelineProgressEvt>("pipeline:progress", (ev) => {
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
    });
    set({ listenersReady: true });
  },

  loadJobs: async () => {
    if (!isTauri()) {
      set({
        error: i18n.t("common:desktopOnly.sqliteShell"),
        ready: true,
      });
      return;
    }
    try {
      const jobs = await listJobs();
      const pendingIds = jobs
        .filter((j) => j.status === "pending")
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )
        .map((j) => j.id);
      set((s) => ({
        jobs,
        ready: true,
        error: null,
        pipelineQueue: [
          ...new Set([...s.pipelineQueue, ...pendingIds]),
        ],
      }));
      await get().processPipelineQueue();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : i18n.t("app:dashboard.errors.loadTranscriptions");
      set({ error: message, ready: true });
    }
  },

  setSelectedJob: (id) => set({ selectedJobId: id }),

  enqueuePipeline: (jobId) => {
    const { pipelineQueue, jobs } = get();
    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.status !== "pending") return;
    if (pipelineQueue.includes(jobId)) return;
    set({ pipelineQueue: [...pipelineQueue, jobId] });
    void get().processPipelineQueue();
  },

  enqueueExternalPipeline: (jobId) => {
    const { pipelineQueue } = get();
    if (pipelineQueue.includes(jobId)) return;
    set({ pipelineQueue: [...pipelineQueue, jobId] });
    void get().processPipelineQueue();
  },

  processPipelineQueue: async () => {
    if (!isTauri()) return;
    if (isRecordSessionActive()) return;

    const { activePipelines, maxConcurrent, pipelineQueue, jobs } = get();
    const slots = maxConcurrent - activePipelines;
    if (slots <= 0 || pipelineQueue.length === 0) return;

    const toStart = pipelineQueue.slice(0, slots);
    const rest = pipelineQueue.filter((id) => !toStart.includes(id));
    set({ pipelineQueue: rest });

    for (const jobId of toStart) {
      let job = jobs.find((j) => j.id === jobId);
      if (!job) {
        job = (await getJobById(jobId)) ?? undefined;
      }
      if (!job || job.status !== "pending") continue;

      set((s) => ({ activePipelines: s.activePipelines + 1 }));

      void (async () => {
        const current = (await getJobById(jobId)) ?? job;
        if (!current || current.status !== "pending") {
          set((s) => ({
            activePipelines: Math.max(0, s.activePipelines - 1),
          }));
          await get().processPipelineQueue();
          return;
        }
        try {
          await invoke("run_pipeline", {
            jobId,
            sourceType: current.source_type,
            sourcePath: current.source_path,
            sourceUrl: current.source_url,
          });
        } catch {
          /* errors recorded in DB */
        } finally {
          await get().loadJobs();
          void useRecordStore.getState().loadJobs();
          set((s) => ({
            activePipelines: Math.max(0, s.activePipelines - 1),
          }));
          await get().processPipelineQueue();
        }
      })();
    }
  },

  addLocalFiles: async (files: File[]) => {
    const created: TranscriptionJob[] = [];
    for (const file of files) {
      const path = filePathIfAvailable(file);
      if (isTauri() && !path) continue;
      const job = await insertJob({
        filename: file.name,
        source_type: "local",
        source_path: path ?? file.name,
        file_size: file.size,
        duration: null,
        status: "pending",
      });
      created.push(job);
    }
    set((s) => ({ jobs: [...created, ...s.jobs], error: null }));
    for (const j of created) get().enqueuePipeline(j.id);
  },

  addLocalFilePaths: async (paths: string[]) => {
    const created: TranscriptionJob[] = [];
    for (const sourcePath of paths) {
      const trimmed = sourcePath.trim();
      if (!trimmed) continue;
      const job = await insertJob({
        filename: basenameFromFsPath(trimmed),
        source_type: "local",
        source_path: trimmed,
        file_size: null,
        duration: null,
        status: "pending",
      });
      created.push(job);
    }
    set((s) => ({ jobs: [...created, ...s.jobs], error: null }));
    for (const j of created) get().enqueuePipeline(j.id);
  },

  addUrlImport: async (url: string) => {
    const trimmed = url.trim();
    const job = await insertJob({
      filename: urlDisplayName(trimmed),
      source_type: "url",
      source_url: trimmed,
      file_size: null,
      duration: null,
      status: "pending",
    });
    set((s) => ({ jobs: [job, ...s.jobs], error: null }));
    get().enqueuePipeline(job.id);

    invoke<string | null>("fetch_url_title", { url: trimmed, jobId: job.id }).then((title) => {
      if (!title) return;
      set((s) => ({
        jobs: s.jobs.map((j) =>
          j.id === job.id ? { ...j, filename: title } : j,
        ),
      }));
    });
  },

  retryJob: async (id: string) => {
    await resetJobForRetry(id);
    await get().loadJobs();
    get().enqueuePipeline(id);
  },

  removeJob: async (id: string) => {
    const job =
      get().jobs.find((j) => j.id === id) ??
      useRecordStore.getState().jobs.find((j) => j.id === id);
    if (job && (job.status === "processing" || job.status === "pending")) {
      await invoke("cancel_pipeline", { jobId: id }).catch(() => {});
    }
    await invoke("delete_job_assets", { jobId: id }).catch(() => {});
    await deleteJob(id);
    set((s) => ({
      jobs: s.jobs.filter((j) => j.id !== id),
      selectedJobId: s.selectedJobId === id ? null : s.selectedJobId,
      pipelineQueue: s.pipelineQueue.filter((x) => x !== id),
    }));
    useRecordStore.setState((s) => ({
      jobs: s.jobs.filter((j) => j.id !== id),
      selectedJobId: s.selectedJobId === id ? null : s.selectedJobId,
    }));
  },

  patchJob: (id, patch) => {
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    }));
  },

  renameJob: async (id: string, filename: string) => {
    const trimmed = filename.trim();
    if (!trimmed) return;
    const current = get().jobs.find((j) => j.id === id);
    if (!current || current.filename === trimmed) return;
    await updateJobFilename(id, trimmed);
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === id ? { ...j, filename: trimmed } : j,
      ),
    }));
  },
}));

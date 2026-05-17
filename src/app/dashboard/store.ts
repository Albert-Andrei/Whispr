import { isTauri } from "@tauri-apps/api/core";
import { create } from "zustand";
import type { TranscriptionJob } from "./types";
import { insertJob, listJobs } from "./db";

type TranscriptionState = {
  jobs: TranscriptionJob[];
  ready: boolean;
  error: string | null;
  loadJobs: () => Promise<void>;
  addLocalFiles: (files: File[]) => Promise<void>;
  addUrlImport: (url: string) => Promise<void>;
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

export const useTranscriptionStore = create<TranscriptionState>((set, get) => ({
  jobs: [],
  ready: false,
  error: null,

  loadJobs: async () => {
    if (!isTauri()) {
      set({
        error:
          "SQLite runs in the desktop shell. Use `bun run tauri dev` instead of the browser-only dev server.",
        ready: true,
      });
      return;
    }
    try {
      const jobs = await listJobs();
      set({ jobs, ready: true, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load transcriptions";
      set({ error: message, ready: true });
    }
  },

  addLocalFiles: async (files: File[]) => {
    const created: TranscriptionJob[] = [];
    for (const file of files) {
      const job = await insertJob({
        filename: file.name,
        source_type: "local",
        source_path: filePathIfAvailable(file) ?? file.name,
        file_size: file.size,
        duration: null,
        status: "pending",
      });
      created.push(job);
    }
    set({ jobs: [...created, ...get().jobs], error: null });
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
    set({ jobs: [job, ...get().jobs], error: null });
  },
}));

import { invoke, isTauri } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { BinaryStatusCard } from "./BinaryStatusCard";
import { DiskBreakdown } from "./DiskBreakdown";
import { GeneralSettings } from "./GeneralSettings";
import { ModelSelector } from "./ModelSelector";
import type { BinaryHealthReport, DiskUsageReport } from "./types";

export function Settings() {
  const [health, setHealth] = useState<BinaryHealthReport | null>(null);
  const [disk, setDisk] = useState<DiskUsageReport | null>(null);

  const load = useCallback(async () => {
    if (!isTauri()) return;
    const [h, d] = await Promise.all([
      invoke<BinaryHealthReport>("check_binaries"),
      invoke<DiskUsageReport>("get_app_disk_usage"),
    ]);
    setHealth(h);
    setDisk(d);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isTauri()) {
    return (
      <div className="px-5 py-8">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Settings that talk to your Mac (binaries, disk usage, models) need the
          desktop app. Run <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">bun run tauri dev</code>{" "}
          instead of the browser-only dev server.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-5 py-8 pb-16">
      <section>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          System dependencies
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Tools used for downloads, audio processing, and transcription.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {health
            ? [health.ffmpeg, health.ytdlp, health.whisper].map((b) => (
                <BinaryStatusCard key={b.id} b={b} />
              ))
            : null}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Refresh status
        </button>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Storage
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Rough breakdown of disk usage for this app.
        </p>
        <div className="mt-4">
          <DiskBreakdown report={disk} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Whisper models
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Multilingual GGML models. Active model is used for new jobs.
        </p>
        <div className="mt-4">
          <ModelSelector onRefresh={load} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          General
        </h2>
        <div className="mt-4">
          <GeneralSettings />
        </div>
      </section>
    </div>
  );
}

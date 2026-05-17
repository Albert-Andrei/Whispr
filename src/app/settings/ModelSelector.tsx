import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { getConfig, setConfig } from "../../lib/db";
import type { ModelTier } from "../setup/SetupScreen";

const TIERS: { tier: ModelTier; file: string; label: string; hint: string }[] = [
  { tier: "small", file: "ggml-small.bin", label: "Small", hint: "~466 MB" },
  { tier: "medium", file: "ggml-medium.bin", label: "Medium", hint: "~1.5 GB" },
  { tier: "large", file: "ggml-large-v3.bin", label: "Large", hint: "~3.1 GB" },
];

type ModelSelectorProps = {
  onRefresh: () => void;
};

export function ModelSelector({ onRefresh }: ModelSelectorProps) {
  const [downloaded, setDownloaded] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [files, sel] = await Promise.all([
      invoke<string[]>("list_model_files"),
      getConfig("selected_model"),
    ]);
    setDownloaded(files);
    setActive(sel);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const download = async (tier: ModelTier) => {
    setBusy(tier);
    try {
      await invoke("download_model_file", { tier });
      await refresh();
      onRefresh();
    } finally {
      setBusy(null);
    }
  };

  const selectModel = async (file: string) => {
    await setConfig("selected_model", file);
    setActive(file);
  };

  const remove = async (file: string) => {
    if (active === file) return;
    await invoke("delete_model_file", { filename: file });
    await refresh();
    onRefresh();
  };

  return (
    <div className="space-y-3">
      {TIERS.map(({ tier, file, label, hint }) => {
        const has = downloaded.includes(file);
        const isActive = active === file;
        return (
          <div
            key={tier}
            className="flex flex-col gap-2 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {label}{" "}
                  <span className="font-normal text-zinc-400">({hint})</span>
                </p>
                <p className="font-mono text-[11px] text-zinc-500">{file}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {isActive ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Active
                  </span>
                ) : has ? (
                  <span className="rounded-full bg-zinc-500/15 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Downloaded
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!has ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void download(tier)}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {busy === tier ? "Downloading…" : "Download"}
                </button>
              ) : null}
              {has && !isActive ? (
                <button
                  type="button"
                  onClick={() => void selectModel(file)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold dark:border-zinc-700"
                >
                  Use
                </button>
              ) : null}
              {has && !isActive ? (
                <button
                  type="button"
                  onClick={() => void remove(file)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-500/40 dark:text-red-300"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

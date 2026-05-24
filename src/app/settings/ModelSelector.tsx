import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { getConfig, setConfig } from "../../lib/db";
import type { ModelTier } from "../setup/SetupScreen";
import { SettingsRow } from "./SettingsLayout";

const TIERS: { tier: ModelTier; file: string; label: string; hint: string }[] =
  [
    { tier: "small", file: "ggml-small.bin", label: "Small", hint: "~466 MB" },
    {
      tier: "medium",
      file: "ggml-medium.bin",
      label: "Medium",
      hint: "~1.5 GB",
    },
    {
      tier: "large",
      file: "ggml-large-v3.bin",
      label: "Large",
      hint: "~3.1 GB",
    },
  ];

type ModelSelectorProps = {
  onRefresh: () => void;
};

export function ModelSelector({ onRefresh }: ModelSelectorProps) {
  const [downloaded, setDownloaded] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [files, selected] = await Promise.all([
      invoke<string[]>("list_model_files"),
      getConfig("selected_model"),
    ]);
    setDownloaded(files);
    setActive(selected);
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
    <>
      {TIERS.map(({ tier, file, label, hint }, index) => {
        const hasFile = downloaded.includes(file);
        const isActive = active === file;
        const isLast = index === TIERS.length - 1;

        return (
          <SettingsRow
            key={tier}
            label={label}
            description={`${hint} · ${file}`}
            last={isLast}
          >
            <div className="flex flex-wrap items-center justify-end gap-2">
              {isActive ? (
                <span className="rounded-md border border-zinc-900 bg-zinc-200 px-2 py-1 text-[12px] font-medium text-zinc-900 dark:border-zinc-400 dark:bg-[#2a2a2d] dark:text-zinc-200">
                  Active
                </span>
              ) : hasFile ? (
                <span className="text-[12px] text-zinc-500">Downloaded</span>
              ) : null}
              {!hasFile ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void download(tier)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[12px] font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-[var(--color-settings-border-dark)] dark:bg-[#353538] dark:text-zinc-200 dark:hover:bg-[#3f3f42]"
                >
                  {busy === tier ? "Downloading…" : "Download"}
                </button>
              ) : null}
              {hasFile && !isActive ? (
                <button
                  type="button"
                  onClick={() => void selectModel(file)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[12px] font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-[var(--color-settings-border-dark)] dark:bg-[#353538] dark:text-zinc-200 dark:hover:bg-[#3f3f42]"
                >
                  Use
                </button>
              ) : null}
              {hasFile && !isActive ? (
                <button
                  type="button"
                  onClick={() => void remove(file)}
                  className="rounded-lg px-2.5 py-1 text-[12px] font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </SettingsRow>
        );
      })}
    </>
  );
}

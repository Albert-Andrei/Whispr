import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getConfig, setConfig } from "../../lib/db";
import type { ModelTier } from "../setup/SetupScreen";
import { SettingsRow } from "./SettingsLayout";

const TIERS: { tier: ModelTier; file: string; labelKey: string; hintKey: string }[] =
  [
    { tier: "small", file: "ggml-small.bin", labelKey: "models.small", hintKey: "models.smallSize" },
    { tier: "medium", file: "ggml-medium.bin", labelKey: "models.medium", hintKey: "models.mediumSize" },
    { tier: "large", file: "ggml-large-v3.bin", labelKey: "models.large", hintKey: "models.largeSize" },
  ];

type ModelSelectorProps = {
  onRefresh: () => void;
};

export function ModelSelector({ onRefresh }: ModelSelectorProps) {
  const { t } = useTranslation("common");
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
      {TIERS.map(({ tier, file, labelKey, hintKey }, index) => {
        const hasFile = downloaded.includes(file);
        const isActive = active === file;
        const isLast = index === TIERS.length - 1;

        return (
          <SettingsRow
            key={tier}
            label={t(labelKey)}
            description={`${t(hintKey)} · ${file}`}
            last={isLast}
          >
            <div className="flex flex-wrap items-center justify-end gap-2">
              {isActive ? (
                <span className="rounded-md border border-zinc-900 bg-zinc-200 px-2 py-1 text-[12px] font-medium text-zinc-900 dark:border-zinc-400 dark:bg-[#2a2a2d] dark:text-zinc-200">
                  {t("models.active")}
                </span>
              ) : hasFile ? (
                <span className="text-[12px] text-zinc-500">{t("models.downloaded")}</span>
              ) : null}
              {!hasFile ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void download(tier)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[12px] font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-[var(--color-settings-border-dark)] dark:bg-[#353538] dark:text-zinc-200 dark:hover:bg-[#3f3f42]"
                >
                  {busy === tier ? t("downloading") : t("actions.download")}
                </button>
              ) : null}
              {hasFile && !isActive ? (
                <button
                  type="button"
                  onClick={() => void selectModel(file)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[12px] font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-[var(--color-settings-border-dark)] dark:bg-[#353538] dark:text-zinc-200 dark:hover:bg-[#3f3f42]"
                >
                  {t("actions.use")}
                </button>
              ) : null}
              {hasFile && !isActive ? (
                <button
                  type="button"
                  onClick={() => void remove(file)}
                  className="rounded-lg px-2.5 py-1 text-[12px] font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  {t("actions.delete")}
                </button>
              ) : null}
            </div>
          </SettingsRow>
        );
      })}
    </>
  );
}

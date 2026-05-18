import { invoke, isTauri } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import type { AppUpdateInfo } from "../../types/types";
import { AboutSettings } from "./AboutSettings";
import { BinaryStatusRows } from "./BinaryStatusRow";
import { DiskBreakdown } from "./DiskBreakdown";
import { GeneralSettings } from "./GeneralSettings";
import { ModelSelector } from "./ModelSelector";
import { SettingsBlock, SettingsSection } from "./SettingsLayout";
import { useBinaryHealth } from "../../hooks/useBinaryHealth";
import type { DiskUsageReport } from "../../types/types";

type SettingsProps = {
  updateInfo: AppUpdateInfo | null;
  updateChecking: boolean;
  onRefreshUpdate: () => void;
};

export function Settings({
  updateInfo,
  updateChecking,
  onRefreshUpdate,
}: SettingsProps) {
  const { health, checking: healthChecking } = useBinaryHealth();
  const [disk, setDisk] = useState<DiskUsageReport | null>(null);

  const loadDisk = useCallback(async () => {
    if (!isTauri()) return;
    const report = await invoke<DiskUsageReport>("get_app_disk_usage");
    setDisk(report);
  }, []);

  useEffect(() => {
    void loadDisk();
  }, [loadDisk]);

  if (!isTauri()) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Settings that talk to your Mac (binaries, disk usage, models) need the
          desktop app. Run{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            bun run tauri dev
          </code>{" "}
          instead of the browser-only dev server.
        </p>
      </div>
    );
  }

  const binaries = health
    ? [health.ffmpeg, health.ytdlp, health.whisper]
    : null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8 pb-16">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>

        <SettingsSection title="About">
          <AboutSettings
            info={updateInfo}
            checking={updateChecking}
            error={null}
            onRefresh={onRefreshUpdate}
          />
        </SettingsSection>

        <SettingsSection title="General">
          <GeneralSettings />
        </SettingsSection>

        <SettingsSection title="System" syncing={healthChecking}>
          <BinaryStatusRows health={binaries} loading={!health} />
        </SettingsSection>

        <SettingsSection title="Storage">
          <SettingsBlock last>
            <p className="mb-3 text-[12px] text-zinc-500 dark:text-zinc-400">
              Rough breakdown of disk usage for this app
            </p>
            <DiskBreakdown report={disk} />
          </SettingsBlock>
        </SettingsSection>

        <SettingsSection title="Whisper models">
          <ModelSelector onRefresh={loadDisk} />
        </SettingsSection>
      </div>
    </div>
  );
}

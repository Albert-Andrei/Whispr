import { invoke, isTauri } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AboutSettings } from "./AboutSettings";
import { DangerZone } from "./DangerZone";
import { DiskBreakdown } from "./DiskBreakdown";
import { GeneralSettings } from "./GeneralSettings";
import { ModelSelector } from "./ModelSelector";
import { SettingsBlock, SettingsSection } from "./SettingsLayout";
import type { AppUpdateHandle } from "../../hooks/useAppUpdate";
import type { DiskUsageReport } from "../../types/types";

type SettingsProps = {
  appUpdate: AppUpdateHandle;
};

export function Settings({ appUpdate }: SettingsProps) {
  const { t } = useTranslation(["common", "app"]);
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
          {t("app:settings.browserOnly")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8 pb-16">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          {t("app:settings.title")}
        </h1>

        <SettingsSection title={t("common:sections.about")}>
          <AboutSettings update={appUpdate} />
        </SettingsSection>

        <SettingsSection title={t("common:sections.general")}>
          <GeneralSettings />
        </SettingsSection>

        <SettingsSection title={t("common:sections.storage")}>
          <SettingsBlock last>
            <p className="mb-3 text-[12px] text-zinc-500 dark:text-zinc-400">
              {t("app:settings.storageDescription")}
            </p>
            <DiskBreakdown report={disk} />
          </SettingsBlock>
        </SettingsSection>

        <SettingsSection title={t("common:sections.whisperModels")}>
          <ModelSelector onRefresh={loadDisk} />
        </SettingsSection>

        <DangerZone />
      </div>
    </div>
  );
}

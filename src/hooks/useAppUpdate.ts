import { invoke, isTauri } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import type { AppUpdateInfo } from "../types/types";

export type AppUpdateHandle = ReturnType<typeof useAppUpdate>;

export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async () => {
    if (!isTauri()) return;
    setChecking(true);
    try {
      const info = await invoke<AppUpdateInfo>("check_for_update");
      setUpdateInfo(info);
    } catch {
      setUpdateInfo({
        currentVersion: "0.0.0",
        latestVersion: null,
        updateAvailable: false,
        releaseUrl: null,
        releaseName: null,
      });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    updateInfo,
    checking,
    refresh,
  };
}

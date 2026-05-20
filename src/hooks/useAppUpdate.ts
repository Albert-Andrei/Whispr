import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppUpdateState } from "../types/types";

export type AppUpdateHandle = ReturnType<typeof useAppUpdate>;

const INITIAL_STATE: AppUpdateState = {
  status: "idle",
  currentVersion: "",
  latestVersion: null,
  downloadProgress: 0,
  error: null,
};

export function useAppUpdate() {
  const [state, setState] = useState<AppUpdateState>(INITIAL_STATE);
  const pendingUpdate = useRef<Update | null>(null);

  const checkForUpdate = useCallback(async () => {
    setState((s) => ({ ...s, status: "checking", error: null }));
    try {
      const update = await check();
      if (update) {
        pendingUpdate.current = update;
        setState((s) => ({
          ...s,
          status: "available",
          currentVersion: update.currentVersion,
          latestVersion: update.version,
        }));
      } else {
        pendingUpdate.current = null;
        setState((s) => ({
          ...s,
          status: "up-to-date",
          currentVersion: s.currentVersion || "",
          latestVersion: null,
        }));
      }
    } catch (e) {
      setState((s) => ({
        ...s,
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      }));
    }
  }, []);

  const installUpdate = useCallback(async () => {
    const update = pendingUpdate.current;
    if (!update) return;

    setState((s) => ({ ...s, status: "downloading", downloadProgress: 0 }));
    try {
      let totalBytes = 0;
      let downloadedBytes = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            totalBytes = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloadedBytes += event.data.chunkLength;
            if (totalBytes > 0) {
              setState((s) => ({
                ...s,
                downloadProgress: Math.round(
                  (downloadedBytes / totalBytes) * 100,
                ),
              }));
            }
            break;
          case "Finished":
            setState((s) => ({
              ...s,
              status: "installing",
              downloadProgress: 100,
            }));
            break;
        }
      });

      await relaunch();
    } catch (e) {
      setState((s) => ({
        ...s,
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      }));
    }
  }, []);

  useEffect(() => {
    void checkForUpdate();
  }, [checkForUpdate]);

  return {
    ...state,
    checkForUpdate,
    installUpdate,
  };
}

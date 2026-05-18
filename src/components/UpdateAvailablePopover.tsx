import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useState } from "react";
import {
  dismissUpdate,
  isUpdateDismissed,
  RELEASES_URL,
} from "../lib/appUpdate";
import type { AppUpdateInfo } from "../types/types";

type UpdateAvailablePopoverProps = {
  updateInfo: AppUpdateInfo | null;
};

export function UpdateAvailablePopover({
  updateInfo,
}: UpdateAvailablePopoverProps) {
  const [hiddenThisSession, setHiddenThisSession] = useState(false);

  const latest = updateInfo?.latestVersion;
  const canShow =
    Boolean(updateInfo?.updateAvailable) &&
    Boolean(latest) &&
    !hiddenThisSession &&
    !isUpdateDismissed(latest!);

  useEffect(() => {
    if (updateInfo?.updateAvailable) setHiddenThisSession(false);
  }, [updateInfo?.latestVersion]);

  if (!canShow || !latest) return null;

  const openRelease = () => {
    void openUrl(updateInfo?.releaseUrl ?? RELEASES_URL);
  };

  const dismiss = () => {
    dismissUpdate(latest);
    setHiddenThisSession(true);
  };

  return (
    <div
      className="group pointer-events-auto fixed right-4 bottom-4 z-[100]"
      data-tauri-no-drag
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute -top-1.5 z-[110] -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-[11px] leading-none text-zinc-400 opacity-0 shadow-sm transition-opacity duration-300 ease-in-out pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
        aria-label="Dismiss update notice"
      >
        ×
      </button>
      <div className="flex items-center gap-6 rounded-lg border border-zinc-200 bg-white/95 py-2.5 pr-2.5 pl-3 shadow-[0_4px_24px_rgba(0,0,0,0.14)] backdrop-blur-sm dark:border-zinc-600 dark:bg-zinc-900/95 dark:shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
        <span className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400">
          Update available
        </span>
        <button
          type="button"
          onClick={openRelease}
          className="shrink-0 rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Update
        </button>
      </div>
    </div>
  );
}

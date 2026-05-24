import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { dismissUpdate, isUpdateDismissed } from "../lib/appUpdate";
import type { AppUpdateHandle } from "../hooks/useAppUpdate";

type UpdateAvailablePopoverProps = {
  update: AppUpdateHandle;
};

export function UpdateAvailablePopover({
  update,
}: UpdateAvailablePopoverProps) {
  const { t } = useTranslation("common");
  const [hiddenThisSession, setHiddenThisSession] = useState(false);

  const latest = update.latestVersion;
  const canShow =
    (update.status === "available" ||
      update.status === "downloading" ||
      update.status === "installing") &&
    Boolean(latest) &&
    !hiddenThisSession &&
    !isUpdateDismissed(latest!);

  useEffect(() => {
    if (update.status === "available") setHiddenThisSession(false);
  }, [update.latestVersion]);

  if (!canShow || !latest) return null;

  const dismiss = () => {
    dismissUpdate(latest);
    setHiddenThisSession(true);
  };

  const isWorking =
    update.status === "downloading" || update.status === "installing";

  return (
    <div
      className="group pointer-events-auto fixed right-4 bottom-4 z-[100]"
      data-tauri-no-drag
      role="status"
      aria-live="polite"
    >
      {!isWorking && (
        <button
          type="button"
          onClick={dismiss}
          className="absolute -top-1.5 z-[110] -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-[11px] leading-none text-zinc-400 opacity-0 shadow-sm transition-opacity duration-300 ease-in-out pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
          aria-label={t("aria.dismissUpdate")}
        >
          ×
        </button>
      )}
      <div className="flex items-center gap-6 rounded-lg border border-zinc-200 bg-white/95 py-2.5 pr-2.5 pl-3 shadow-[0_4px_24px_rgba(0,0,0,0.14)] backdrop-blur-sm dark:border-zinc-600 dark:bg-zinc-900/95 dark:shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
        {isWorking ? (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400">
                {update.status === "installing"
                  ? t("update.installingUpdate")
                  : t("update.downloadingUpdate", {
                      percent: update.downloadProgress,
                    })}
              </span>
              <div className="h-1 w-36 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
                  style={{ width: `${update.downloadProgress}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <span className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400">
              {t("update.versionAvailable", { version: latest })}
            </span>
            <button
              type="button"
              onClick={update.installUpdate}
              className="shrink-0 rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {t("update.updateAndRestart")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

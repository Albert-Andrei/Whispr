import { useTranslation } from "react-i18next";
import { SettingsRow } from "./SettingsLayout";
import type { AppUpdateHandle } from "../../hooks/useAppUpdate";

const BTN_SECONDARY =
  "rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

const BTN_PRIMARY =
  "rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white";

function VersionStatusBadge({ update }: { update: AppUpdateHandle }) {
  const { t } = useTranslation("common");
  if (update.status === "checking") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 text-[10px] font-medium leading-none text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {t("checking")}
      </span>
    );
  }
  if (update.status === "available") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-zinc-900 px-2 text-[10px] font-semibold leading-none text-white dark:bg-zinc-100 dark:text-zinc-900">
        {t("update.available")}
      </span>
    );
  }
  if (
    update.status === "downloading" ||
    update.status === "installing"
  ) {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 text-[10px] font-medium leading-none text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {update.status === "installing"
          ? t("installing")
          : t("update.downloadingPercent", { percent: update.downloadProgress })}
      </span>
    );
  }
  if (update.status === "up-to-date") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-zinc-300 bg-zinc-100 px-2 text-[10px] font-medium leading-none text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {t("update.upToDate")}
      </span>
    );
  }
  if (update.status === "error") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-red-200 bg-red-50 px-2 text-[10px] font-medium leading-none text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        {t("update.error")}
      </span>
    );
  }
  return null;
}

type AboutSettingsProps = {
  update: AppUpdateHandle;
};

export function AboutSettings({ update }: AboutSettingsProps) {
  const { t } = useTranslation("common");
  const isWorking =
    update.status === "downloading" || update.status === "installing";

  const description =
    update.status === "available"
      ? t("update.updateAvailableVersion", { version: update.latestVersion })
      : update.status === "up-to-date"
        ? t("update.latestRelease")
        : update.status === "error"
          ? t("update.couldNotCheck")
          : isWorking
            ? t("update.inProgress")
            : "";

  return (
    <>
      <SettingsRow label={t("details.version")} description={description} last>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
              v{update.currentVersion || "—"}
            </span>
            <VersionStatusBadge update={update} />
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <button
              type="button"
              onClick={update.checkForUpdate}
              disabled={update.status === "checking" || isWorking}
              className={`${BTN_SECONDARY} disabled:opacity-50`}
            >
              {update.status === "checking" ? t("checking") : t("actions.checkAgain")}
            </button>
            {update.status === "available" && (
              <button
                type="button"
                onClick={update.installUpdate}
                className={BTN_PRIMARY}
              >
                {t("update.installVersion", { version: update.latestVersion })}
              </button>
            )}
          </div>
          {isWorking && (
            <div className="mt-1 h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
                style={{ width: `${update.downloadProgress}%` }}
              />
            </div>
          )}
        </div>
      </SettingsRow>
      {update.error ? (
        <p className="border-t border-zinc-100 px-4 py-3 text-[12px] text-red-600 dark:border-[var(--color-settings-border-dark)] dark:text-red-400">
          {update.error}
        </p>
      ) : null}
    </>
  );
}

import { openUrl } from "@tauri-apps/plugin-opener";
import { RELEASES_URL } from "../../lib/appUpdate";
import { SettingsRow } from "./SettingsLayout";
import type { AppUpdateInfo } from "../../types/types";

const BTN_SECONDARY =
  "rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

const BTN_PRIMARY =
  "rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white";

function VersionStatusBadge({
  info,
  checking,
}: {
  info: AppUpdateInfo | null;
  checking: boolean;
}) {
  if (checking) {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 text-[10px] font-medium leading-none text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        Checking…
      </span>
    );
  }
  if (info?.updateAvailable) {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-zinc-900 px-2 text-[10px] font-semibold leading-none text-white dark:bg-zinc-100 dark:text-zinc-900">
        Update available
      </span>
    );
  }
  if (info?.latestVersion) {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-zinc-300 bg-zinc-100 px-2 text-[10px] font-medium leading-none text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        Up to date
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 text-[10px] font-medium leading-none text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
      Could not check
    </span>
  );
}

type AboutSettingsProps = {
  info: AppUpdateInfo | null;
  checking: boolean;
  error: string | null;
  onRefresh: () => void;
};

export function AboutSettings({
  info,
  checking,
  error,
  onRefresh,
}: AboutSettingsProps) {
  const openRelease = () => {
    const url = info?.releaseUrl ?? RELEASES_URL;
    void openUrl(url);
  };

  const description = info?.updateAvailable
    ? `Update available: v${info.latestVersion}`
    : info?.latestVersion
      ? "You are on the latest release"
      : "Offline or no releases published yet";

  return (
    <>
      <SettingsRow label="Version" description={description} last>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
              v{info?.currentVersion ?? "—"}
            </span>
            <VersionStatusBadge info={info} checking={checking} />
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <button
              type="button"
              onClick={onRefresh}
              disabled={checking}
              className={`${BTN_SECONDARY} disabled:opacity-50`}
            >
              {checking ? "Checking…" : "Check again"}
            </button>
            {info?.updateAvailable ? (
              <button type="button" onClick={openRelease} className={BTN_PRIMARY}>
                Download v{info.latestVersion}
              </button>
            ) : (
              <button type="button" onClick={openRelease} className={BTN_SECONDARY}>
                Releases
              </button>
            )}
          </div>
        </div>
      </SettingsRow>
      {error ? (
        <p className="border-t border-zinc-100 px-4 py-3 text-[12px] text-red-600 dark:border-[var(--color-settings-border-dark)] dark:text-red-400">
          {error}
        </p>
      ) : null}
    </>
  );
}

import { Dialog } from "@base-ui-components/react/dialog";
import { invoke } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function DangerZone() {
  const { t } = useTranslation(["common", "app"]);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await invoke("reset_all_data");
      await relaunch();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
          {t("app:settings.dangerZone.description")}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70"
        >
          {t("app:settings.dangerZone.button")}
        </button>
      </div>

      <Dialog.Root open={open} onOpenChange={(next) => !next && setOpen(false)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <Dialog.Title className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
              {t("app:settings.dangerZone.dialog.title")}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {t("app:settings.dangerZone.dialog.body")}
            </Dialog.Description>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {t("common:actions.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
              >
                {deleting
                  ? t("app:settings.dangerZone.dialog.deleting")
                  : t("app:settings.dangerZone.dialog.confirm")}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

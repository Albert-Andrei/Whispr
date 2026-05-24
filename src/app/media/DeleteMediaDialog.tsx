import { Dialog } from "@base-ui-components/react/dialog";
import { useTranslation } from "react-i18next";
import type { PlaybackMediaItem } from "./types";

type DeleteMediaDialogProps = {
  item: PlaybackMediaItem | null;
  open: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteMediaDialog({
  item,
  open,
  deleting,
  onClose,
  onConfirm,
}: DeleteMediaDialogProps) {
  const { t } = useTranslation(["common", "app"]);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <Dialog.Title className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
            {t("app:media.delete.title")}
          </Dialog.Title>
          <Dialog.Description className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              {t("app:media.delete.willRemove", { filename: item?.filename ?? t("app:media.delete.thisFile") })}
            </p>
            <p>
              {t("app:media.delete.transcriptStays")}
              {item?.hasSyncedPlayback
                ? t("app:media.delete.syncLoss")
                : ""}
              {t("app:media.delete.retranscribe")}
            </p>
          </Dialog.Description>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {t("common:actions.cancel")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
            >
              {deleting ? t("common:deleting") : t("app:media.delete.confirm")}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

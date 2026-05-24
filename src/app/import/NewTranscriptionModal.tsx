import { Dialog } from "@base-ui-components/react/dialog";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NewImportStep } from "../../types";
import { DropZone } from "./DropZone";
import { URLInput } from "./URLInput";

type NewTranscriptionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set (e.g. from dashboard CTAs), focus URL field or hint local path. */
  initialFocus?: NewImportStep | null;
  onLocalFiles: (files: File[]) => Promise<void>;
  /** Desktop: absolute paths from the native file dialog. */
  onLocalFilePaths?: (paths: string[]) => Promise<void>;
  onUrl: (url: string) => Promise<void>;
};

export function NewTranscriptionModal({
  open,
  onOpenChange,
  initialFocus = null,
  onLocalFiles,
  onLocalFilePaths,
  onUrl,
}: NewTranscriptionModalProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [focusUrl, setFocusUrl] = useState(false);

  useEffect(() => {
    if (!open) {
      setBusy(false);
      setFocusUrl(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) setFocusUrl(initialFocus === "url");
  }, [open, initialFocus]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Viewport className="fixed inset-0 z-50 grid place-items-center p-4">
          <Dialog.Popup className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-none">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Dialog.Title className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {t("import.modal.title")}
                </Dialog.Title>
                <Dialog.Description className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {t("import.modal.description")}
                </Dialog.Description>
              </div>
              <Dialog.Close
                className="-mr-1 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label={t("common:actions.close")}
              >
                ×
              </Dialog.Close>
            </div>

            <div className="mt-8 space-y-6">
              <URLInput
                disabled={busy}
                focusRequest={focusUrl}
                onSubmitUrl={(url) => {
                  void run(() => onUrl(url));
                }}
              />

              <div
                className="relative flex items-center justify-center"
                aria-hidden
              >
                <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200 dark:bg-zinc-700" />
                <span className="relative bg-white px-3 text-xs font-medium text-zinc-400 dark:bg-zinc-950 dark:text-zinc-500">
                  {t("common:or")}
                </span>
              </div>

              <DropZone
                disabled={busy}
                onPaths={
                  onLocalFilePaths
                    ? (paths) => void run(() => onLocalFilePaths(paths))
                    : undefined
                }
                onFiles={(files) => {
                  void run(() => onLocalFiles(files));
                }}
              />
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

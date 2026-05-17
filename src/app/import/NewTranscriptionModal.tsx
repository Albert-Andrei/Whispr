import { Dialog } from "@base-ui-components/react/dialog";
import { useEffect, useState } from "react";
import type { NewImportStep } from "../../types";
import { DropZone } from "./DropZone";
import { URLInput } from "./URLInput";

type NewTranscriptionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStep?: NewImportStep;
  onLocalFiles: (files: File[]) => Promise<void>;
  onUrl: (url: string) => Promise<void>;
};

export function NewTranscriptionModal({
  open,
  onOpenChange,
  initialStep = "choose",
  onLocalFiles,
  onUrl,
}: NewTranscriptionModalProps) {
  const [step, setStep] = useState<NewImportStep>("choose");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("choose");
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) setStep(initialStep);
  }, [open, initialStep]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      onOpenChange(false);
      setStep("choose");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Viewport className="fixed inset-0 z-50 grid place-items-center p-4">
          <Dialog.Popup className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl outline-none dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  New transcription
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Import from a link or add local media files.
                </Dialog.Description>
              </div>
              <Dialog.Close
                className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                aria-label="Close"
              >
                ✕
              </Dialog.Close>
            </div>

            <div className="mt-6">
              {step === "choose" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStep("url")}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:border-indigo-300 hover:bg-white disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-400 dark:hover:bg-zinc-900/80"
                  >
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Import from URL
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      YouTube, Vimeo, and more.
                    </p>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStep("local")}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:border-indigo-300 hover:bg-white disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-400 dark:hover:bg-zinc-900/80"
                  >
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Import local file
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Drag & drop or browse.
                    </p>
                  </button>
                </div>
              ) : null}

              {step === "url" ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStep("choose")}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    ← Back
                  </button>
                  <URLInput
                    disabled={busy}
                    onSubmitUrl={(url) => {
                      void run(() => onUrl(url));
                    }}
                  />
                </div>
              ) : null}

              {step === "local" ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStep("choose")}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    ← Back
                  </button>
                  <DropZone
                    disabled={busy}
                    onFiles={(files) => {
                      void run(() => onLocalFiles(files));
                    }}
                  />
                </div>
              ) : null}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

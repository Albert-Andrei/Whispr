import { Dialog } from "@base-ui-components/react/dialog";

type NavGuardDialogProps = {
  open: boolean;
  onClose: () => void;
  onStopAndSave: () => void;
  onDiscard: () => void;
};

export function NavGuardDialog({
  open,
  onClose,
  onStopAndSave,
  onDiscard,
}: NavGuardDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <Dialog.Title className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
            Recording in progress
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Stop and save your recording, discard it, or stay here to continue.
          </Dialog.Description>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={onStopAndSave}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Stop & save
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

import { useState } from "react";
import { DropZone } from "../import/DropZone";
import { URLInput } from "../import/URLInput";

type EmptyStateProps = {
  onSubmitUrl: (url: string) => Promise<void>;
  onLocalFiles: (files: File[]) => Promise<void>;
  onLocalFilePaths?: (paths: string[]) => Promise<void>;
};

export function EmptyState({ onSubmitUrl, onLocalFiles, onLocalFilePaths }: EmptyStateProps) {
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-6 sm:py-8">
      <div className="w-full max-w-[380px]">
        <div className="text-center">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            No transcriptions yet
          </h2>
          <p className="mt-1.5 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
            Paste a link or drop a file below. Everything runs offline on your Mac—no API
            keys.
          </p>
        </div>

        <div className="mt-5 space-y-4 text-left">
          <URLInput
            compact
            disabled={busy}
            focusRequest
            onSubmitUrl={(url) => void run(() => onSubmitUrl(url))}
          />

          <div className="relative flex items-center justify-center py-0.5" aria-hidden>
            <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200/90 dark:bg-zinc-700/80" />
            <span className="relative bg-white px-2 text-[11px] font-medium text-zinc-400 dark:bg-zinc-950 dark:text-zinc-500">
              or
            </span>
          </div>

          <DropZone
            compact
            disabled={busy}
            onPaths={
              onLocalFilePaths
                ? (paths) => void run(() => onLocalFilePaths(paths))
                : undefined
            }
            onFiles={(files) => void run(() => onLocalFiles(files))}
          />
        </div>
      </div>
    </div>
  );
}

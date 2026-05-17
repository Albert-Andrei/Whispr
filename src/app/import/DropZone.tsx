import { useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { message, open } from "@tauri-apps/plugin-dialog";
import {
  ACCEPT_INPUT_ATTRIBUTE,
  DIALOG_MEDIA_FILTER,
  isAcceptedMediaFile,
} from "./constants";

type DropZoneProps = {
  onFiles: (files: File[]) => void;
  /** Tauri: absolute paths from the native picker or drag-and-drop with `File.path`. */
  onPaths?: (paths: string[]) => void;
  disabled?: boolean;
  /** Tighter padding only; same dashed panel + chrome as the modal. */
  compact?: boolean;
};

const DRAG_ACTIVE = [
  "bg-zinc-50",
  "dark:bg-zinc-800/50",
  "ring-2",
  "ring-zinc-300",
  "ring-inset",
  "dark:ring-zinc-600",
] as const;

function filePathFromWebFile(file: File): string | undefined {
  const p = (file as File & { path?: string }).path;
  return typeof p === "string" && p.length > 0 ? p : undefined;
}

export function DropZone({
  onFiles,
  onPaths,
  disabled,
  compact = false,
}: DropZoneProps) {
  const dragDepth = useRef(0);

  const handleFiles = (list: FileList | null) => {
    if (!list || disabled) return;
    const files = [...list].filter(isAcceptedMediaFile);
    if (files.length === 0) return;

    if (isTauri() && onPaths) {
      const paths = files
        .map((f) => filePathFromWebFile(f))
        .filter((p): p is string => p !== undefined);
      if (paths.length === files.length) {
        onPaths(paths);
        return;
      }
      if (paths.length > 0) {
        onPaths(paths);
        void message(
          "Some files could not be added because their path was not available. Use Browse to pick files, or drop them from Finder.",
          { title: "Whispr", kind: "warning" },
        );
        return;
      }
    }

    onFiles(files);
  };

  const openNativePicker = async () => {
    if (disabled) return;
    try {
      const selected = await open({
        multiple: true,
        title: "Choose video or audio",
        filters: [DIALOG_MEDIA_FILTER],
      });
      if (selected === null) return;
      const paths = Array.isArray(selected) ? selected : [selected];
      onPaths?.(paths);
    } catch {
      /* dialog unavailable or dismissed */
    }
  };

  const clearDragHighlight = (el: HTMLDivElement) => {
    for (const c of DRAG_ACTIVE) {
      el.classList.remove(c);
    }
  };

  const addDragHighlight = (el: HTMLDivElement) => {
    for (const c of DRAG_ACTIVE) {
      el.classList.add(c);
    }
  };

  const shell =
    "border border-dashed border-zinc-200 bg-white text-center transition-colors dark:border-zinc-600 dark:bg-zinc-950 " +
    (compact ? "rounded-xl px-5 py-6" : "rounded-2xl px-6 py-10");

  const browseButtonClass =
    compact
      ? "inline-flex w-full max-w-full items-center justify-center rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 has-disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 sm:max-w-[200px]"
      : "inline-flex w-full max-w-full items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 has-disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 sm:max-w-[200px]";

  const useNativePicker = isTauri() && !!onPaths;

  return (
    <div
      className={shell}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDepth.current += 1;
        if (dragDepth.current === 1) addDragHighlight(e.currentTarget);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          clearDragHighlight(e.currentTarget);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDepth.current = 0;
        clearDragHighlight(e.currentTarget);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Drag & drop video or audio files
      </p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        MP4, MOV, MKV, WebM, AVI, MP3, WAV, M4A, FLAC, OGG, AAC
      </p>

      <div
        className={`flex w-full cursor-pointer justify-center ${compact ? "mt-5" : "mt-8"}`}
      >
        {useNativePicker ? (
          <button
            type="button"
            disabled={disabled}
            className={browseButtonClass}
            onClick={() => void openNativePicker()}
          >
            Browse files...
          </button>
        ) : (
          <label className="flex w-full cursor-pointer justify-center">
            <span className={browseButtonClass}>
              <input
                type="file"
                className="sr-only"
                accept={ACCEPT_INPUT_ATTRIBUTE}
                disabled={disabled}
                multiple
                onChange={(e) => handleFiles(e.target.files)}
              />
              Browse files...
            </span>
          </label>
        )}
      </div>
    </div>
  );
}

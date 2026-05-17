import { useRef } from "react";
import { ACCEPT_INPUT_ATTRIBUTE, isAcceptedMediaFile } from "./constants";

type DropZoneProps = {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
};

export function DropZone({ onFiles, disabled }: DropZoneProps) {
  const dragDepth = useRef(0);

  const handleFiles = (list: FileList | null) => {
    if (!list || disabled) return;
    const files = [...list].filter(isAcceptedMediaFile);
    if (files.length > 0) onFiles(files);
  };

  const clearDragHighlight = (el: HTMLDivElement) => {
    el.classList.remove(
      "border-indigo-500",
      "bg-indigo-50",
      "dark:border-indigo-400",
      "dark:bg-indigo-950/40",
    );
  };

  const addDragHighlight = (el: HTMLDivElement) => {
    el.classList.add(
      "border-indigo-500",
      "bg-indigo-50",
      "dark:border-indigo-400",
      "dark:bg-indigo-950/40",
    );
  };

  return (
    <div
      className="rounded-xl border-2 border-dashed border-zinc-300 bg-white/50 px-6 py-10 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-500"
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
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        Drag & drop video or audio files
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        MP4, MOV, MKV, WebM, AVI, MP3, WAV, M4A, FLAC, OGG, AAC
      </p>

      <label className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 has-[:disabled]:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">
        <input
          type="file"
          className="sr-only"
          accept={ACCEPT_INPUT_ATTRIBUTE}
          disabled={disabled}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
        Browse files…
      </label>
    </div>
  );
}

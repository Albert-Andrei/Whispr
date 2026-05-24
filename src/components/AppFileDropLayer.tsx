import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  collectDroppedMedia,
  dispatchDroppedMedia,
  filterAcceptedMediaPaths,
  isFileDragEvent,
} from "../app/import/dropMedia";

type AppFileDropLayerProps = {
  enabled: boolean;
  modalOpen: boolean;
  onLocalFiles: (files: File[]) => Promise<void>;
  onLocalFilePaths?: (paths: string[]) => Promise<void>;
  onDropped?: () => void;
};

export function AppFileDropLayer({
  enabled,
  modalOpen,
  onLocalFiles,
  onLocalFilePaths,
  onDropped,
}: AppFileDropLayerProps) {
  const { t } = useTranslation("app");
  const [dragActive, setDragActive] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setDragActive(false);
      return;
    }

    const processPaths = async (paths: string[]) => {
      const accepted = filterAcceptedMediaPaths(paths);
      if (accepted.length === 0 || busyRef.current) return;
      busyRef.current = true;
      try {
        if (!onLocalFilePaths) return;
        await onLocalFilePaths(accepted);
        onDropped?.();
      } finally {
        busyRef.current = false;
      }
    };

    const processFileList = async (list: FileList | null) => {
      const media = collectDroppedMedia(list);
      if (!media || busyRef.current) return;
      busyRef.current = true;
      try {
        await dispatchDroppedMedia(media, {
          onPaths: onLocalFilePaths,
          onFiles: onLocalFiles,
        });
        onDropped?.();
      } finally {
        busyRef.current = false;
      }
    };

    if (isTauri()) {
      let unlisten: (() => void) | undefined;
      let cancelled = false;

      void getCurrentWebview()
        .onDragDropEvent((event) => {
          const payload = event.payload;
          switch (payload.type) {
            case "enter": {
              const hasAccepted =
                filterAcceptedMediaPaths(payload.paths).length > 0;
              setDragActive(hasAccepted);
              break;
            }
            case "over":
              break;
            case "leave":
              setDragActive(false);
              break;
            case "drop":
              setDragActive(false);
              void processPaths(payload.paths);
              break;
          }
        })
        .then((fn) => {
          if (cancelled) fn();
          else unlisten = fn;
        });

      return () => {
        cancelled = true;
        unlisten?.();
        setDragActive(false);
      };
    }

    let depth = 0;

    const onDragEnter = (e: DragEvent) => {
      if (!isFileDragEvent(e)) return;
      e.preventDefault();
      depth += 1;
      if (depth === 1) setDragActive(true);
    };

    const onDragOver = (e: DragEvent) => {
      if (!isFileDragEvent(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };

    const onDragLeave = (e: DragEvent) => {
      if (!isFileDragEvent(e)) return;
      e.preventDefault();
      depth -= 1;
      if (depth <= 0) {
        depth = 0;
        setDragActive(false);
      }
    };

    const onDrop = (e: DragEvent) => {
      if (!isFileDragEvent(e)) return;
      e.preventDefault();
      depth = 0;
      setDragActive(false);
      void processFileList(e.dataTransfer?.files ?? null);
    };

    const onDragEnd = () => {
      depth = 0;
      setDragActive(false);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragend", onDragEnd);

    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragend", onDragEnd);
      setDragActive(false);
    };
  }, [enabled, onLocalFiles, onLocalFilePaths, onDropped]);

  if (!enabled || !dragActive) return null;

  const zClass = modalOpen ? "z-[60]" : "z-30";

  return (
    <div
      className={`pointer-events-none fixed inset-0 ${zClass} flex items-center justify-center bg-zinc-900/15 backdrop-blur-[2px] dark:bg-zinc-100/10`}
      aria-hidden
    >
      <div className="rounded-2xl w-[80%] h-[70%] flex flex-col items-center justify-center border-2 border-dashed border-zinc-400/90 bg-zinc-900/10 px-10 py-8 text-center shadow-lg dark:border-zinc-500/70 dark:bg-zinc-100/5">
        <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {t("components.appFileDropLayer.title")}
        </p>
        <p className="mt-1.5 text-xl text-zinc-700/85 dark:text-zinc-200/80">
          {t("components.appFileDropLayer.subtitle")}
        </p>
      </div>
    </div>
  );
}

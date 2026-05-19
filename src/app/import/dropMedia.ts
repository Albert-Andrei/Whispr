import { isTauri } from "@tauri-apps/api/core";
import { message } from "@tauri-apps/plugin-dialog";
import { isAcceptedMediaFile, isAcceptedMediaPath } from "./constants";

export function filePathFromWebFile(file: File): string | undefined {
  const p = (file as File & { path?: string }).path;
  return typeof p === "string" && p.length > 0 ? p : undefined;
}

export type DroppedMedia = {
  files: File[];
  paths: string[];
};

export function collectDroppedMedia(list: FileList | null): DroppedMedia | null {
  if (!list) return null;
  const files = [...list].filter(isAcceptedMediaFile);
  if (files.length === 0) return null;
  const paths = files
    .map(filePathFromWebFile)
    .filter((p): p is string => p !== undefined);
  return { files, paths };
}

export async function dispatchDroppedMedia(
  media: DroppedMedia,
  handlers: {
    onPaths?: (paths: string[]) => Promise<void>;
    onFiles: (files: File[]) => Promise<void>;
  },
): Promise<void> {
  const { files, paths } = media;
  if (isTauri() && handlers.onPaths) {
    if (paths.length === files.length) {
      await handlers.onPaths(paths);
      return;
    }
    if (paths.length > 0) {
      await handlers.onPaths(paths);
      void message(
        "Some files could not be added because their path was not available. Use Browse to pick files, or drop them from Finder.",
        { title: "Whispr", kind: "warning" },
      );
      return;
    }
  }
  await handlers.onFiles(files);
}

export function filterAcceptedMediaPaths(paths: string[]): string[] {
  return paths.filter(isAcceptedMediaPath);
}

export function isFileDragEvent(e: DragEvent): boolean {
  const types = e.dataTransfer?.types;
  if (!types) return false;
  return Array.from(types).includes("Files");
}

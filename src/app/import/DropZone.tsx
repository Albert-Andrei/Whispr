import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";
import {
  ACCEPT_INPUT_ATTRIBUTE,
  DIALOG_MEDIA_FILTER,
  isAcceptedMediaFile,
} from "./constants";

type DropZoneProps = {
  onFiles: (files: File[]) => void;
  /** Tauri: absolute paths from the native picker. */
  onPaths?: (paths: string[]) => void;
  disabled?: boolean;
  /** Tighter padding only; same dashed panel + chrome as the modal. */
  compact?: boolean;
};

export function DropZone({
  onFiles,
  onPaths,
  disabled,
  compact = false,
}: DropZoneProps) {
  const { t } = useTranslation();

  const openNativePicker = async () => {
    if (disabled) return;
    try {
      const selected = await open({
        multiple: true,
        title: t("import.dropZone.chooseTitle"),
        filters: [DIALOG_MEDIA_FILTER],
      });
      if (selected === null) return;
      const paths = Array.isArray(selected) ? selected : [selected];
      onPaths?.(paths);
    } catch {
      /* dialog unavailable or dismissed */
    }
  };

  const shell =
    "border border-dashed border-zinc-200 bg-white text-center transition-colors dark:border-zinc-600 dark:bg-zinc-950 " +
    (compact ? "rounded-xl px-5 py-6" : "rounded-2xl px-8 py-14");

  const browseButtonClass = compact
    ? "inline-flex w-full max-w-full items-center justify-center rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 has-disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 sm:max-w-[200px]"
    : "inline-flex w-full max-w-full items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 has-disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 sm:max-w-[200px]";

  const useNativePicker = isTauri() && !!onPaths;

  return (
    <div className={shell}>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {t("import.dropZone.title")}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        {t("import.dropZone.formats")}
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
            {t("common:actions.browseFiles")}
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
                onChange={(e) => {
                  if (!e.target.files || disabled) return;
                  const files = [...e.target.files].filter(isAcceptedMediaFile);
                  if (files.length > 0) onFiles(files);
                  e.target.value = "";
                }}
              />
              {t("common:actions.browseFiles")}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}

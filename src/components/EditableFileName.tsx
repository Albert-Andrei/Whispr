import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";

function IconPencil() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

type EditableFileNameProps = {
  fileName: string;
  onRename: (filename: string) => void;
  variant?: "header" | "row";
  onClick?: (e: MouseEvent) => void;
};

export function EditableFileName({
  fileName,
  onRename,
  variant = "header",
  onClick,
}: EditableFileNameProps) {
  const { t } = useTranslation("common");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fileName);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRow = variant === "row";
  const titleClass = isRow
    ? "text-sm font-medium text-zinc-900 dark:text-zinc-100"
    : "text-[15px] font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50";
  const inputClass = isRow
    ? "text-sm font-medium"
    : "text-[15px] font-semibold tracking-[-0.02em]";
  const editBtnClass = isRow ? "h-6 w-6" : "h-7 w-7";

  useEffect(() => {
    if (!editing) setDraft(fileName);
  }, [fileName, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== fileName) {
      onRename(trimmed);
      setDraft(trimmed);
    } else {
      setDraft(fileName);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(fileName);
    setEditing(false);
  };

  const stopRowClick = (e: MouseEvent) => {
    e.stopPropagation();
    onClick?.(e);
  };

  const startEditing = (e: MouseEvent) => {
    stopRowClick(e);
    setEditing(true);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        data-tauri-no-drag
        value={draft}
        onClick={stopRowClick}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        className={`min-w-0 max-w-full rounded-md border border-zinc-300 bg-white px-2 py-0.5 text-zinc-900 outline-none ring-2 ring-zinc-900/20 focus:border-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-400/20 dark:focus:border-zinc-400 ${inputClass}`}
        aria-label={t("aria.editTitle")}
      />
    );
  }

  return (
    <div
      className="flex min-w-0 max-w-full items-center gap-0.5"
      onClick={stopRowClick}
      data-tauri-no-drag
    >
      <button
        type="button"
        onClick={startEditing}
        className={`min-w-0 truncate rounded-md px-1 py-0.5 text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${titleClass}`}
        title={t("aria.clickToRename")}
      >
        {fileName}
      </button>
      <button
        type="button"
        onClick={startEditing}
        aria-label={t("aria.rename")}
        className={`flex shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 ${editBtnClass}`}
      >
        <IconPencil />
      </button>
    </div>
  );
}

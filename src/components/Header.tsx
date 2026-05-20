import { windowDragPointerDown } from "../lib/windowDrag";
import { EditableFileName } from "./EditableFileName";

type TranscriptDetail = {
  fileName: string;
  onBack: () => void;
  onRename: (filename: string) => void;
  onDelete: () => void;
};

type HeaderProps = {
  title: string;
  onNewTranscription: () => void;
  transcriptDetail?: TranscriptDetail;
};

function IconChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function Header({
  title,
  onNewTranscription,
  transcriptDetail,
}: HeaderProps) {
  return (
    <header
      data-tauri-drag-region
      onPointerDown={windowDragPointerDown}
      className="flex h-[52px] shrink-0 select-none items-center justify-between gap-4 border-b border-zinc-100 px-5 dark:border-zinc-800/90"
    >
      {transcriptDetail ? (
        <div className="flex min-w-0 flex-1 items-center gap-0.5">
          <button
            type="button"
            data-tauri-no-drag
            onClick={transcriptDetail.onBack}
            aria-label="Back to transcriptions"
            className="-ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-transparent text-zinc-600 transition hover:bg-[var(--color-sidebar-hover-light)] dark:text-zinc-300 dark:hover:bg-[var(--color-sidebar-hover-dark)]"
          >
            <IconChevronLeft />
          </button>
          <EditableFileName
            fileName={transcriptDetail.fileName}
            onRename={transcriptDetail.onRename}
            variant="header"
          />
        </div>
      ) : (
        <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-[-0.02em] text-zinc-700 dark:text-zinc-50">
          {title}
        </h1>
      )}

      <div className="flex shrink-0 items-center gap-2" data-tauri-no-drag>
        {transcriptDetail ? (
          <button
            type="button"
            onClick={transcriptDetail.onDelete}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Delete
          </button>
        ) : null}
        <button
          type="button"
          onClick={onNewTranscription}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 pl-[8px] text-[13px] font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          <IconPlus />
          New
        </button>
      </div>
    </header>
  );
}

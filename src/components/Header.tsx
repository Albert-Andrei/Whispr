import { windowDragPointerDown } from "../lib/windowDrag";

type HeaderProps = {
  title: string;
  onNewTranscription: () => void;
};

export function Header({ title, onNewTranscription }: HeaderProps) {
  return (
    <header
      data-tauri-drag-region
      onPointerDown={windowDragPointerDown}
      className="flex h-[52px] shrink-0 select-none items-center justify-between gap-4 border-b border-zinc-100 px-5 dark:border-zinc-800/90"
    >
      <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-[-0.02em] text-zinc-700 dark:text-zinc-50">
        {title}
      </h1>
      <button
        type="button"
        data-tauri-no-drag
        onClick={onNewTranscription}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        <span className="text-base font-light leading-none" aria-hidden>
          +
        </span>
        New
      </button>
    </header>
  );
}

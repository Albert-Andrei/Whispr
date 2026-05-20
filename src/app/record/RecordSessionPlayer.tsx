import { Waveform } from "./Waveform";

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function IconPause() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconStop() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

function IconTrash() {
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

type RecordSessionPlayerProps = {
  paused: boolean;
  elapsedMs: number;
  level: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDiscard: () => void;
};

export function RecordSessionPlayer({
  paused,
  elapsedMs,
  level,
  onPause,
  onResume,
  onStop,
  onDiscard,
}: RecordSessionPlayerProps) {
  return (
    <div className="absolute bottom-4 left-1/2 flex w-[min(90%,480px)] -translate-x-1/2 items-center gap-3 rounded-full border border-zinc-200/80 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-sm transition-all dark:border-zinc-700 dark:bg-zinc-900/95">
      <span className="shrink-0 text-[11px] font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
        {paused ? "Paused" : "REC"}
      </span>

      <span className="shrink-0 text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
        {formatTime(elapsedMs)}
      </span>

      <Waveform level={level} />

      <button
        type="button"
        onClick={paused ? onResume : onPause}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-800 transition hover:bg-zinc-100 active:scale-95 dark:text-zinc-200 dark:hover:bg-zinc-800"
        title={paused ? "Resume" : "Pause"}
      >
        {paused ? <IconPlay /> : <IconPause />}
      </button>

      <button
        type="button"
        onClick={onStop}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-700 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        title="Stop and save"
      >
        <IconStop />
      </button>

      <button
        type="button"
        onClick={onDiscard}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        title="Discard recording"
      >
        <IconTrash />
      </button>
    </div>
  );
}

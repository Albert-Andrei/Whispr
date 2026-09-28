import { useEffect, useState } from "react";

/** "01:02:03" — always hours, minutes and seconds, like a timecode. */
export function formatTimecode(totalSecs: number): string {
  const s = Math.max(0, Math.round(totalSecs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => n.toString().padStart(2, "0")).join(":");
}

/** Accepts "h:m:s", "m:s" or plain seconds. */
export function parseTimecode(text: string): number | null {
  const parts = text.trim().split(":");
  if (parts.length === 0 || parts.length > 3) return null;
  let secs = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part.trim())) return null;
    secs = secs * 60 + Number.parseInt(part, 10);
  }
  return secs;
}

type TimeFieldProps = {
  label: string;
  valueSecs: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (secs: number) => void;
  /** Sets the field to the preview's current position. */
  onUseCurrent?: () => void;
  useCurrentLabel: string;
};

export function TimeField({
  label,
  valueSecs,
  min,
  max,
  disabled,
  onChange,
  onUseCurrent,
  useCurrentLabel,
}: TimeFieldProps) {
  const [draft, setDraft] = useState(() => formatTimecode(valueSecs));

  useEffect(() => {
    setDraft(formatTimecode(valueSecs));
  }, [valueSecs]);

  const commit = () => {
    const parsed = parseTimecode(draft);
    if (parsed === null) {
      setDraft(formatTimecode(valueSecs));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    setDraft(formatTimecode(clamped));
    if (clamped !== valueSecs) onChange(clamped);
  };

  return (
    <label className="block min-w-0">
      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <div className="mt-1 flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 pr-1 focus-within:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:border-zinc-500">
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-center text-sm tabular-nums tracking-wide text-zinc-900 outline-none disabled:opacity-50 dark:text-zinc-100"
        />
        {onUseCurrent ? (
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              onUseCurrent();
            }}
            title={useCurrentLabel}
            aria-label={useCurrentLabel}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
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
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </button>
        ) : null}
      </div>
    </label>
  );
}

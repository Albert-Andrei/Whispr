import { useState, useRef, useEffect } from "react";
import { Menu } from "@base-ui-components/react/menu";
import { useTranslation } from "react-i18next";
import type { PlaybackSpeed } from "../../hooks/useTranscriptPlayback";

const SPEEDS: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
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

function IconVolume({ level }: { level: number }) {
  if (level === 0) {
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
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }
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
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {level > 0.33 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
      {level > 0.66 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
    </svg>
  );
}

function VolumeControl({
  volume,
  onSetVolume,
}: {
  volume: number;
  onSetVolume: (v: number) => void;
}) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        title={t("common:playback.volume")}
      >
        <IconVolume level={volume} />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 flex-col items-center rounded-lg border border-zinc-200/90 bg-white px-2.5 py-3 shadow-md dark:border-zinc-600 dark:bg-zinc-800">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onSetVolume(parseFloat(e.target.value))}
            className="h-20 w-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-800 dark:bg-zinc-700 dark:accent-zinc-300 [writing-mode:vertical-lr] [direction:rtl] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-800 dark:[&::-webkit-slider-thumb]:bg-zinc-200"
          />
        </div>
      )}
    </div>
  );
}

type TranscriptPlayerProps = {
  playing: boolean;
  currentTime: number;
  duration: number;
  speed: PlaybackSpeed;
  volume: number;
  expanded: boolean;
  onTogglePlay: () => void;
  onSeekFraction: (fraction: number) => void;
  onSetSpeed: (s: PlaybackSpeed) => void;
  onSetVolume: (v: number) => void;
};

export function TranscriptPlayer({
  playing,
  currentTime,
  duration,
  speed,
  volume,
  expanded,
  onTogglePlay,
  onSeekFraction,
  onSetSpeed,
  onSetVolume,
}: TranscriptPlayerProps) {
  const { t } = useTranslation("common");

  if (!expanded) {
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition hover:bg-zinc-700 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          title={t("playback.play")}
        >
          <IconPlay />
        </button>
      </div>
    );
  }

  const fraction = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="absolute bottom-4 left-1/2 flex w-[min(90%,480px)] -translate-x-1/2 items-center gap-3 rounded-full border border-zinc-200/80 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-sm transition-all dark:border-zinc-700 dark:bg-zinc-900/95">
      <button
        type="button"
        onClick={onTogglePlay}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-800 transition hover:bg-zinc-100 active:scale-95 dark:text-zinc-200 dark:hover:bg-zinc-800"
        title={playing ? t("playback.pause") : t("playback.play")}
      >
        {playing ? <IconPause /> : <IconPlay />}
      </button>

      <span className="shrink-0 text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
        {formatTime(currentTime)}
      </span>

      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={fraction}
        onChange={(e) => onSeekFraction(parseFloat(e.target.value))}
        className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-800 dark:bg-zinc-700 dark:accent-zinc-300 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-800 dark:[&::-webkit-slider-thumb]:bg-zinc-200"
      />

      <span className="shrink-0 text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
        {formatTime(duration)}
      </span>

      <div className="flex items-center gap-1">
        <VolumeControl volume={volume} onSetVolume={onSetVolume} />

        <Menu.Root modal={false}>
          <Menu.Trigger
            render={(props) => (
              <button
                {...props}
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-medium tabular-nums text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                {speed}×
              </button>
            )}
          />
          <Menu.Portal>
            <Menu.Positioner side="top" align="center" sideOffset={6}>
              <Menu.Popup className="rounded-md border border-zinc-200/90 bg-white py-1 shadow-md outline-none dark:border-zinc-600 dark:bg-zinc-800">
                {SPEEDS.map((s) => (
                  <Menu.Item
                    key={s}
                    label={`${s}×`}
                    onClick={() => onSetSpeed(s)}
                    className={`cursor-default px-3 py-1 text-[12px] tabular-nums outline-none data-highlighted:bg-zinc-100 dark:data-highlighted:bg-zinc-700/80 ${
                      s === speed
                        ? "font-medium text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    {s}×
                  </Menu.Item>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>
    </div>
  );
}

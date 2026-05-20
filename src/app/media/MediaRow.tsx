import { convertFileSrc } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import type { PlaybackMediaItem } from "./types";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sourceLabel(sourceType: string | null): string {
  if (sourceType === "record") return "Recording";
  if (sourceType === "url") return "URL import";
  if (sourceType === "local") return "Local file";
  return "Transcription";
}

function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
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

type MediaRowProps = {
  item: PlaybackMediaItem;
  playing: boolean;
  onPlayToggle: () => void;
  onStop: () => void;
  onDelete: () => void;
};

export function MediaRow({
  item,
  playing,
  onPlayToggle,
  onStop,
  onDelete,
}: MediaRowProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = new Audio(convertFileSrc(item.path));
    audio.preload = "metadata";
    audioRef.current = audio;

    const onLoaded = () => setDuration(audio.duration);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      onStop();
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, [item.path, onStop]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, [playing]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800">
      <button
        type="button"
        onClick={onPlayToggle}
        aria-label={playing ? "Pause" : "Play"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {playing ? <IconPause /> : <IconPlay />}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-50">
          {item.filename}
        </p>
        <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">
          {sourceLabel(item.sourceType)} · {formatBytes(item.bytes)}
          {item.hasSyncedPlayback ? " · Synced playback" : ""}
        </p>
        {playing && duration > 0 ? (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <span
              className="block h-full rounded-full bg-zinc-900 transition-[width] dark:bg-zinc-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${item.filename}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <IconTrash />
      </button>
    </li>
  );
}

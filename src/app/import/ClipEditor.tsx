import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ClipRange, TranscriptionJob } from "../dashboard/types";
import { RangeSlider } from "./RangeSlider";
import { TimeField, formatTimecode } from "./TimeField";
import type { ImportSource } from "./types";
import { useClipPlayer } from "./useClipPlayer";
import { useSourceProbe } from "./useSourceProbe";

/** Last selection per draft, so reopening a "Not started" row keeps it. */
const rememberedRanges = new Map<string, { start: number; end: number }>();

type ClipEditorProps = {
  source: ImportSource;
  /** Draft job id: keys the remembered selection. */
  draftId: string;
  /** Called once the media length is known (shown on the draft's row). */
  onDuration?: (secs: number) => void;
  busy?: boolean;
  /** Cancel: discards the draft. */
  onBack: () => void;
  /** `clip` is null when the whole media is selected. */
  onConfirm: (clip: ClipRange | null, title: string | null) => void;
};

/** The media a draft job points at. */
export function importSourceOfJob(job: TranscriptionJob): ImportSource {
  return job.source_type === "url"
    ? { kind: "url", url: job.source_url ?? "" }
    : { kind: "local", path: job.source_path ?? "", name: job.filename };
}

/** Selections this close to the media edges count as "the whole thing". */
const EDGE_TOLERANCE_SECS = 0.5;

/**
 * Preview a link or file and pick the part to transcribe, e.g. 40 minutes of
 * a 4-hour video. Only that part is downloaded, converted and transcribed.
 */
export function ClipEditor({
  source,
  draftId,
  onDuration,
  busy,
  onBack,
  onConfirm,
}: ClipEditorProps) {
  const { t } = useTranslation(["app", "common"]);
  const probe = useSourceProbe(source);
  const player = useClipPlayer(probe.videoUrl, probe.audioUrl);

  const duration = probe.durationSecs ?? player.mediaDuration ?? null;
  const [range, setRangeState] = useState<{ start: number; end: number } | null>(
    () => rememberedRanges.get(draftId) ?? null,
  );
  const setRange = (next: { start: number; end: number }) => {
    rememberedRanges.set(draftId, next);
    setRangeState(next);
  };

  // Select everything as soon as the length is known.
  useEffect(() => {
    if (duration && !range) setRange({ start: 0, end: Math.floor(duration) });
  }, [duration, range]);

  useEffect(() => {
    if (duration) onDuration?.(duration);
  }, [duration]);

  const hasRange = duration !== null && range !== null;
  const start = range?.start ?? 0;
  const end = range?.end ?? 0;
  const canPlay = !!(probe.videoUrl || probe.audioUrl) && !player.failed;
  const title =
    probe.title ?? (source.kind === "local" ? source.name : source.url);

  const confirm = () => {
    if (!hasRange || !duration) {
      onConfirm(null, probe.title);
      return;
    }
    const whole = start <= EDGE_TOLERANCE_SECS && end >= duration - EDGE_TOLERANCE_SECS;
    onConfirm(whole ? null : { startMs: start * 1000, endMs: end * 1000 }, probe.title);
  };

  const setStart = (s: number) => {
    setRange({ start: s, end: Math.max(end, s + 1) });
    if (!player.playing) player.seek(s);
  };
  const setEnd = (e: number) => {
    setRange({ start: Math.min(start, e - 1), end: e });
    if (!player.playing) player.seek(e);
  };

  let notice: string | null = null;
  if (probe.status === "error") notice = t("app:import.clipEditor.loadError");
  else if (probe.status === "ready" && probe.unplayable)
    notice = t("app:import.clipEditor.noPreview");
  else if (player.failed) notice = t("app:import.clipEditor.previewFailed");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="flex h-7 shrink-0 items-center rounded-md border border-zinc-200 px-2 text-[12px] font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          {t("common:actions.cancel")}
        </button>
        <p className="min-w-0 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100" title={title}>
          {probe.status === "loading" && source.kind === "url" ? source.url : title}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:items-start">
        {/* Preview */}
        <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-900 dark:bg-black">
          {probe.videoUrl && !player.failed ? (
            <video
              ref={player.videoRef}
              src={probe.videoUrl}
              poster={probe.thumbnail ?? undefined}
              preload="metadata"
              playsInline
              onClick={player.togglePlay}
              className="h-full w-full cursor-pointer object-contain"
            />
          ) : probe.thumbnail ? (
            <img src={probe.thumbnail} alt="" className="h-full w-full object-cover opacity-80" />
          ) : probe.status === "loading" ? null : (
            <div className="flex h-full w-full items-center justify-center text-zinc-500">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
          )}
          {probe.audioUrl ? (
            <audio ref={player.audioRef} src={probe.audioUrl} preload="metadata" />
          ) : null}

          {probe.status === "loading" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 text-[13px] text-zinc-300">
              <span className="animate-pulse">{t("app:import.clipEditor.loading")}</span>
            </div>
          ) : null}

          {canPlay && !player.playing && probe.status === "ready" ? (
            <button
              type="button"
              onClick={player.togglePlay}
              aria-label={t("common:playback.play")}
              className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          ) : null}

          {canPlay && probe.status === "ready" ? (
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-black/55 px-3 py-2 text-white">
              <button
                type="button"
                onClick={player.togglePlay}
                aria-label={player.playing ? t("common:playback.pause") : t("common:playback.play")}
                className="flex h-6 w-6 shrink-0 items-center justify-center"
              >
                {player.playing ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={duration ?? 1}
                step={0.1}
                value={Math.min(player.currentTime, duration ?? 1)}
                onChange={(e) => player.seek(Number(e.target.value))}
                aria-label={t("app:import.clipEditor.position")}
                className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/30 accent-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
              <span className="shrink-0 text-[11px] tabular-nums text-white/85">
                {formatTimecode(player.currentTime)} / {formatTimecode(duration ?? 0)}
              </span>
            </div>
          ) : null}
        </div>

        {/* Section controls */}
        <div className="flex flex-col gap-4">
          {hasRange ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <TimeField
                  label={t("app:import.clipEditor.start")}
                  valueSecs={start}
                  min={0}
                  max={Math.max(0, end - 1)}
                  disabled={busy}
                  onChange={setStart}
                  onUseCurrent={canPlay ? () => setStart(Math.min(Math.floor(player.currentTime), end - 1)) : undefined}
                  useCurrentLabel={t("app:import.clipEditor.setToCurrent")}
                />
                <TimeField
                  label={t("app:import.clipEditor.end")}
                  valueSecs={end}
                  min={start + 1}
                  max={Math.floor(duration)}
                  disabled={busy}
                  onChange={setEnd}
                  onUseCurrent={canPlay ? () => setEnd(Math.max(Math.ceil(player.currentTime), start + 1)) : undefined}
                  useCurrentLabel={t("app:import.clipEditor.setToCurrent")}
                />
              </div>

              <RangeSlider
                max={Math.floor(duration)}
                start={start}
                end={end}
                playhead={canPlay ? player.currentTime : undefined}
                disabled={busy}
                onChange={(s, e, moved) => {
                  setRange({ start: s, end: e });
                  if (!player.playing) player.seek(moved === "start" ? s : e);
                }}
              />

              <div className="flex items-center justify-between gap-2 text-[12px] text-zinc-500 dark:text-zinc-400">
                <span className="tabular-nums">
                  {t("app:import.clipEditor.selected", {
                    length: formatTimecode(end - start),
                    total: formatTimecode(duration),
                  })}
                </span>
                {start > 0 || end < Math.floor(duration) ? (
                  <button
                    type="button"
                    onClick={() => setRange({ start: 0, end: Math.floor(duration) })}
                    className="text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-zinc-100"
                  >
                    {t("app:import.clipEditor.selectAll")}
                  </button>
                ) : null}
              </div>
            </>
          ) : probe.status === "loading" ? (
            <div className="space-y-3" aria-hidden>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-[58px] animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
                <div className="h-[58px] animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
              </div>
              <div className="h-5 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-900" />
            </div>
          ) : null}

          {notice ? (
            <p className="text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">{notice}</p>
          ) : null}

          <div className="mt-auto flex gap-2">
            {hasRange && canPlay ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => (player.previewing ? player.stop() : player.playRange(start, end))}
                className="flex-1 rounded-lg border border-zinc-200 bg-white py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                {player.previewing
                  ? t("app:import.clipEditor.stopPreview")
                  : t("app:import.clipEditor.preview")}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy || (probe.status === "loading" && source.kind === "local")}
              onClick={confirm}
              className="flex-[1.4] rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              {hasRange && duration && (start > EDGE_TOLERANCE_SECS || end < duration - EDGE_TOLERANCE_SECS)
                ? t("app:import.clipEditor.transcribeSection")
                : t("app:import.clipEditor.transcribe")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { pipelineStageLabel } from "../../lib/i18nLabels";

type PipelineStatusProps = {
  /** Classes for the status chip (shared with the other row statuses). */
  chipClassName: string;
  /** Overall job progress, 0..1 (bar and percent). */
  progress: number;
  stage: string | null;
  /** Progress within the current stage, 0..1 (time-left estimate). */
  stageProgress?: number;
};

/** Wait this long into a stage before trusting its rate for a time-left estimate. */
const ETA_MIN_ELAPSED_MS = 3000;
const ETA_MIN_PROGRESS = 0.01;
const ETA_SMOOTHING = 0.3;
const ETA_STAGES = new Set(["downloading", "transcribing"]);

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** Estimates time left in the current stage from how fast it has progressed so far. */
function useStageEta(stage: string | null, stageProgress: number | undefined) {
  const track = useRef<{
    stage: string | null;
    startedAt: number;
    startProgress: number;
    eta: number | null;
  }>({ stage: null, startedAt: 0, startProgress: 0, eta: null });

  const now = Date.now();
  const tr = track.current;
  if (stageProgress === undefined) return null;
  if (tr.stage !== stage || stageProgress < tr.startProgress) {
    track.current = { stage, startedAt: now, startProgress: stageProgress, eta: null };
    return null;
  }

  const elapsed = now - tr.startedAt;
  const done = stageProgress - tr.startProgress;
  if (elapsed < ETA_MIN_ELAPSED_MS || done < ETA_MIN_PROGRESS) return tr.eta;

  const raw = ((elapsed / done) * (1 - stageProgress)) / 1000;
  tr.eta = tr.eta === null ? raw : tr.eta + ETA_SMOOTHING * (raw - tr.eta);
  return tr.eta;
}

/**
 * Fixed-size status for a running job, laid out on a grid so nothing shifts
 * as numbers change:
 *
 *   [Processing]  34% · ~5:35
 *   [====bar===]  Transcribing
 */
export function PipelineStatus({
  chipClassName,
  progress,
  stage,
  stageProgress,
}: PipelineStatusProps) {
  const { t } = useTranslation("backend");
  // Bar and percent follow the whole job so they move steadily from 0 to 100.
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const stageLabel = pipelineStageLabel(t, stage);
  // Time left for the step named beside the bar. Only the long steps get one:
  // downloading (hours-long videos) and transcribing (the last step, so it's
  // the job's remaining time). Fetching and converting are short and jumpy.
  const stageEta = useStageEta(stage, stageProgress);
  const eta = stage && ETA_STAGES.has(stage) ? stageEta : null;

  return (
    <div className="grid grid-cols-[auto_7rem] items-center gap-x-2 gap-y-1.5 text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
      <span
        className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium ${chipClassName}`}
      >
        {t("jobStatus.processing")}
      </span>
      <span className="truncate">
        {eta !== null ? `${pct}% · ~${formatClock(eta)}` : `${pct}%`}
      </span>
      <div className="h-[3px] overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-sky-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="truncate leading-[14px]">{stageLabel ?? ""}</span>
    </div>
  );
}

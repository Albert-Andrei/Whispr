import { useTranslation } from "react-i18next";
import { pipelineStageLabel } from "../../lib/i18nLabels";

type ProgressBarProps = {
  progress: number;
  stage: string | null;
};

export function ProgressBar({ progress, stage }: ProgressBarProps) {
  const { t } = useTranslation("backend");
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const stageLabel = pipelineStageLabel(t, stage);

  return (
    <div className="mt-2 w-full max-w-[200px]">
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-sky-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {stageLabel ? (
        <p className="mt-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
          {t("pipelineStage.progress", { stage: stageLabel, percent: pct })}
        </p>
      ) : null}
    </div>
  );
}

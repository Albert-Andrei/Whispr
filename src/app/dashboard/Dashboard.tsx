import type { NewImportStep } from "../../types";
import { EmptyState } from "./EmptyState";
import { FileList } from "./FileList";
import { useTranscriptionStore } from "./store";

type DashboardProps = {
  onRequestImport: (step: Exclude<NewImportStep, "choose">) => void;
};

export function Dashboard({ onRequestImport }: DashboardProps) {
  const jobs = useTranscriptionStore((s) => s.jobs);
  const ready = useTranscriptionStore((s) => s.ready);
  const error = useTranscriptionStore((s) => s.error);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-16 text-sm text-zinc-500 dark:text-zinc-400">
        Loading your transcriptions…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-16 text-center">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Check app permissions or restart Whispr.
        </p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return <EmptyState onPickImport={onRequestImport} />;
  }

  return <FileList jobs={jobs} />;
}

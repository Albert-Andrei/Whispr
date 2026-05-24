import { useTranslation } from "react-i18next";
import { EmptyState } from "./EmptyState";
import { FileList } from "./FileList";
import { TranscriptView } from "./TranscriptView";
import { useTranscriptionStore } from "./store";

export function Dashboard() {
  const { t } = useTranslation("app");
  const jobs = useTranscriptionStore((state) => state.jobs);
  const ready = useTranscriptionStore((state) => state.ready);
  const error = useTranscriptionStore((state) => state.error);
  const selectedId = useTranscriptionStore((state) => state.selectedJobId);
  const addLocalFiles = useTranscriptionStore((state) => state.addLocalFiles);
  const addLocalFilePaths = useTranscriptionStore((state) => state.addLocalFilePaths);
  const addUrlImport = useTranscriptionStore((state) => state.addUrlImport);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-16 text-sm text-zinc-500 dark:text-zinc-400">
        {t("dashboard.loading")}
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
          {t("dashboard.errors.hint")}
        </p>
      </div>
    );
  }

  if (selectedId) {
    return <TranscriptView />;
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        onSubmitUrl={addUrlImport}
        onLocalFiles={addLocalFiles}
        onLocalFilePaths={addLocalFilePaths}
      />
    );
  }

  return <FileList jobs={jobs} />;
}

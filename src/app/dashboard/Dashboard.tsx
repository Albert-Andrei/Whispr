import { EmptyState } from "./EmptyState";
import { FileList } from "./FileList";
import { TranscriptView } from "./TranscriptView";
import { useTranscriptionStore } from "./store";

export function Dashboard() {
  const jobs = useTranscriptionStore((s) => s.jobs);
  const ready = useTranscriptionStore((s) => s.ready);
  const error = useTranscriptionStore((s) => s.error);
  const selectedId = useTranscriptionStore((s) => s.selectedJobId);
  const addLocalFiles = useTranscriptionStore((s) => s.addLocalFiles);
  const addLocalFilePaths = useTranscriptionStore((s) => s.addLocalFilePaths);
  const addUrlImport = useTranscriptionStore((s) => s.addUrlImport);

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

import { useTranslation } from "react-i18next";
import { ClipEditor, importSourceOfJob } from "../import/ClipEditor";
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
  const clipEditor = useTranscriptionStore((state) => state.clipEditor);
  const createDraft = useTranscriptionStore((state) => state.createDraft);
  const startDraft = useTranscriptionStore((state) => state.startDraft);
  const discardDraft = useTranscriptionStore((state) => state.discardDraft);
  const setDraftDuration = useTranscriptionStore((state) => state.setDraftDuration);

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

  const inlineDraft =
    clipEditor?.where === "inline" ? jobs.find((j) => j.id === clipEditor.jobId) : undefined;
  if (inlineDraft) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 py-6 sm:justify-center sm:py-8">
        <div className="w-full max-w-4xl">
          <ClipEditor
            key={inlineDraft.id}
            source={importSourceOfJob(inlineDraft)}
            draftId={inlineDraft.id}
            onDuration={(secs) => setDraftDuration(inlineDraft.id, secs)}
            onBack={() => void discardDraft(inlineDraft.id)}
            onConfirm={(clip, title) => void startDraft(inlineDraft.id, clip, title)}
          />
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        onPickSource={(source) => createDraft(source, "inline")}
        onLocalFiles={addLocalFiles}
        onLocalFilePaths={addLocalFilePaths}
      />
    );
  }

  return <FileList jobs={jobs} />;
}

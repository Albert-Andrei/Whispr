import { useTranscriptionStore } from "./store";
import type { TranscriptionJob } from "./types";
import { ProgressBar } from "./ProgressBar";

const STATUS_STYLES: Record<
  TranscriptionJob["status"],
  string
> = {
  pending:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
  processing:
    "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25",
  completed:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  failed: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/25",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type FileRowProps = {
  job: TranscriptionJob;
};

export function FileRow({ job }: FileRowProps) {
  const setSelected = useTranscriptionStore((s) => s.setSelectedJob);
  const retryJob = useTranscriptionStore((s) => s.retryJob);
  const removeJob = useTranscriptionStore((s) => s.removeJob);

  const onRowClick = () => {
    if (job.status === "completed") setSelected(job.id);
  };

  return (
    <tr
      role={job.status === "completed" ? "button" : undefined}
      tabIndex={job.status === "completed" ? 0 : undefined}
      onClick={onRowClick}
      onKeyDown={(e) => {
        if (job.status === "completed" && (e.key === "Enter" || e.key === " "))
          setSelected(job.id);
      }}
      className={`border-b border-zinc-100 transition dark:border-zinc-800/80 ${
        job.status === "completed"
          ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
      }`}
    >
      <td className="max-w-[240px] truncate px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {job.filename}
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
        {job.duration ?? "—"}
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
        {formatDate(job.created_at)}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-col gap-1">
          <span
            className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[job.status]}`}
          >
            {job.status}
          </span>
          {job.status === "processing" ? (
            <ProgressBar progress={job.progress} stage={job.pipeline_stage} />
          ) : null}
          {job.status === "failed" && job.error_message ? (
            <p className="max-w-xs text-[11px] text-red-600 dark:text-red-400">
              {job.error_message}
            </p>
          ) : null}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div
          className="flex flex-row flex-nowrap items-center justify-end gap-1.5"
          data-tauri-no-drag
        >
          {job.status === "completed" ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelected(job.id);
              }}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              View
            </button>
          ) : null}
          {job.status === "failed" ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void retryJob(job.id);
              }}
              className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
            >
              Retry
            </button>
          ) : null}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void removeJob(job.id);
            }}
            className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

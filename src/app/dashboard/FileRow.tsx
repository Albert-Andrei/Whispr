import type { TranscriptionJob } from "./types";

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
  return (
    <tr className="border-b border-zinc-100 transition hover:bg-zinc-50 dark:border-zinc-800/80 dark:hover:bg-zinc-900/50">
      <td className="max-w-[240px] truncate px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {job.filename}
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
        {job.duration ?? "—"}
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
        {formatDate(job.created_at)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[job.status]}`}
        >
          {job.status}
        </span>
      </td>
    </tr>
  );
}

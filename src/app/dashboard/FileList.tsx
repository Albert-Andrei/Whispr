import { FileRow } from "./FileRow";
import type { TranscriptionJob } from "./types";

type FileListProps = {
  jobs: TranscriptionJob[];
};

export function FileList({ jobs }: FileListProps) {
  return (
    <div className="px-5 py-6">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/40">
        <table className="w-full border-collapse text-left">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <FileRow key={job.id} job={job} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

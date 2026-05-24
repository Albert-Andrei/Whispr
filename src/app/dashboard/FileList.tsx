import { useTranslation } from "react-i18next";
import { FileRow } from "./FileRow";
import type { TranscriptionJob } from "./types";

type FileListProps = {
  jobs: TranscriptionJob[];
  setSelectedJob?: (id: string | null) => void;
  onJobsChanged?: () => void;
  className?: string;
};

export function FileList({
  jobs,
  setSelectedJob,
  onJobsChanged,
  className,
}: FileListProps) {
  const { t } = useTranslation("common");

  return (
    <div className={className ?? "px-5 py-6"}>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/40">
        <table className="w-full border-collapse text-left">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">{t("table.name")}</th>
              <th className="px-4 py-3">{t("table.duration")}</th>
              <th className="px-4 py-3">{t("table.date")}</th>
              <th className="px-4 py-3">{t("table.status")}</th>
              <th className="px-4 py-3">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <FileRow
                key={job.id}
                job={job}
                setSelectedJob={setSelectedJob}
                onJobsChanged={onJobsChanged}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

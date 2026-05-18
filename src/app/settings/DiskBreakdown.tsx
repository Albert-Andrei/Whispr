import type { DiskUsageReport } from "../../types/types";

const PALETTE = [
  "bg-indigo-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-400",
];

export function DiskBreakdown({ report }: { report: DiskUsageReport | null }) {
  if (!report || report.totalBytes === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No usage data yet.
      </p>
    );
  }

  const total = report.totalBytes;

  return (
    <div className="space-y-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        {report.categories.map((c, i) => {
          const w = total > 0 ? (c.bytes / total) * 100 : 0;
          if (w < 0.05) return null;
          return (
            <div
              key={c.id}
              className={`${PALETTE[i % PALETTE.length]} h-full`}
              style={{ width: `${w}%` }}
              title={c.label}
            />
          );
        })}
      </div>
      <ul className="space-y-2 text-sm">
        {report.categories.map((c) => (
          <li key={c.id} className="flex justify-between gap-4">
            <span className="text-zinc-600 dark:text-zinc-400">{c.label}</span>
            <span className="shrink-0 font-medium text-zinc-900 dark:text-zinc-100">
              {(c.bytes / 1024 / 1024).toFixed(1)} MB
              <span className="ml-2 text-xs font-normal text-zinc-400">
                ({total > 0 ? Math.round((c.bytes / total) * 100) : 0}%)
              </span>
            </span>
          </li>
        ))}
        <li className="flex justify-between border-t border-zinc-200 pt-2 font-semibold dark:border-zinc-800">
          <span>Total</span>
          <span>{(total / 1024 / 1024).toFixed(1)} MB</span>
        </li>
      </ul>
    </div>
  );
}

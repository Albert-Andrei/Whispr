import { Tooltip } from "../../components/Tooltip";
import type { DiskUsageReport } from "../../types/types";

/** Stable, distinct hue per category — matches bar + legend dots */
const CATEGORY_COLORS: Record<string, string> = {
  binaries: "bg-blue-600",
  models: "bg-sky-500",
  database: "bg-amber-500",
  temp: "bg-emerald-500",
  app_core: "bg-red-500",
};

const FALLBACK_COLORS = [
  "bg-blue-600",
  "bg-sky-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-red-500",
];

function colorClass(categoryId: string, index: number): string {
  return CATEGORY_COLORS[categoryId] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function formatTooltipLabel(
  label: string,
  bytes: number,
  total: number,
): string {
  const megabytes = (bytes / 1024 / 1024).toFixed(1);
  const percent = total > 0 ? Math.round((bytes / total) * 100) : 0;
  return `${label} · ${megabytes} MB (${percent}%)`;
}

export function DiskBreakdown({ report }: { report: DiskUsageReport | null }) {
  if (!report || report.totalBytes === 0) {
    return (
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
        No usage data yet.
      </p>
    );
  }

  const total = report.totalBytes;
  const barSegments = report.categories
    .map((category, index) => ({ category, index }))
    .filter(({ category }) => {
      const width = total > 0 ? (category.bytes / total) * 100 : 0;
      return width >= 0.05;
    });

  const visibleCategories = report.categories.filter(
    (category) => category.bytes > 0,
  );

  return (
    <div className="space-y-4">
      <div
        className="flex h-2 rounded-full bg-zinc-100 dark:bg-zinc-800"
        role="img"
        aria-label="Disk usage by category"
      >
          {barSegments.map(({ category, index }, segmentIndex) => {
          const width = total > 0 ? (category.bytes / total) * 100 : 0;
          const color = colorClass(category.id, index);
          const isFirst = segmentIndex === 0;
          const isLast = segmentIndex === barSegments.length - 1;
          const radius =
            isFirst && isLast
              ? "rounded-full"
              : isFirst
                ? "rounded-l-full"
                : isLast
                  ? "rounded-r-full"
                  : "";

          return (
            <Tooltip
              key={category.id}
              label={formatTooltipLabel(category.label, category.bytes, total)}
              className="h-full"
              style={{ width: `${width}%` }}
            >
              <span
                className={`block h-full w-full ${color} ${radius} transition-opacity hover:opacity-90`}
                aria-hidden
              />
            </Tooltip>
          );
        })}
      </div>

      <ul className="space-y-2">
        {visibleCategories.map((category) => {
          const originalIndex = report.categories.findIndex(
            (item) => item.id === category.id,
          );
          const color = colorClass(category.id, originalIndex);
          return (
            <li
              key={category.id}
              className="flex justify-between gap-4 text-[13px]"
            >
              <span className="flex min-w-0 items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`}
                  aria-hidden
                />
                {category.label}
              </span>
              <span className="shrink-0 font-medium text-zinc-900 dark:text-zinc-100">
                {(category.bytes / 1024 / 1024).toFixed(1)} MB
                <span className="ml-1.5 font-normal text-zinc-400">
                  ({total > 0 ? Math.round((category.bytes / total) * 100) : 0}
                  %)
                </span>
              </span>
            </li>
          );
        })}
        <li className="flex justify-between border-t border-zinc-100 pt-2 text-[13px] font-semibold dark:border-[var(--color-settings-border-dark)]">
          <span>Total</span>
          <span>{(total / 1024 / 1024).toFixed(1)} MB</span>
        </li>
      </ul>
    </div>
  );
}


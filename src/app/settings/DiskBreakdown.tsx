import { useTranslation } from "react-i18next";
import { Tooltip } from "../../components/Tooltip";
import { diskCategoryLabel } from "../../lib/i18nLabels";
import type { DiskUsageReport } from "../../types/types";

/** Category colors (inspired by macOS storage, tuned for Whispr) */
const CATEGORY_COLORS: Record<string, string> = {
  binaries: "#F5A64B",
  models: "#e85625",
  audio: "#E8C825",
  database: "#8E8E93",
  temp: "#50E3C2",
  app_core: "#6ABF26",
};

const FALLBACK_COLORS = [
  "#EE5D52",
  "#F5A64B",
  "#F8E71C",
  "#7ED321",
  "#50E3C2",
  "#8E8E93",
];

function categoryColor(categoryId: string, index: number): string {
  return (
    CATEGORY_COLORS[categoryId] ??
    FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  );
}

function formatPercent(bytes: number, total: number): string {
  if (total <= 0) return "0";
  const pct = (bytes / total) * 100;
  if (pct > 0 && pct < 1) return pct.toFixed(2);
  return String(Math.round(pct));
}

function formatStorageSize(bytes: number): string {
  const megabytes = bytes / 1024 / 1024;
  if (megabytes > 999) {
    const gigabytes = bytes / 1024 / 1024 / 1024;
    const decimals = gigabytes >= 10 ? 1 : 2;
    return `${gigabytes.toFixed(decimals)} GB`;
  }
  return `${megabytes.toFixed(1)} MB`;
}

function formatTooltipLabel(
  label: string,
  bytes: number,
  total: number,
): string {
  return `${label} · ${formatStorageSize(bytes)} (${formatPercent(bytes, total)}%)`;
}

export function DiskBreakdown({ report }: { report: DiskUsageReport | null }) {
  const { t } = useTranslation(["common", "app"]);
  if (!report || report.totalBytes === 0) {
    return (
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
        {t("app:settings.diskBreakdown.noData")}
      </p>
    );
  }

  const total = report.totalBytes;
  const sortedCategories = [...report.categories].sort(
    (a, b) => b.bytes - a.bytes,
  );

  const barSegments = sortedCategories.filter((category) => {
    const width = total > 0 ? (category.bytes / total) * 100 : 0;
    return width >= 0.05;
  });

  const visibleCategories = sortedCategories.filter(
    (category) => category.bytes > 0,
  );

  return (
    <div className="space-y-4">
      <div
        className="flex h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
        role="img"
        aria-label={t("common:aria.diskUsageByCategory")}
      >
        {barSegments.map((category, segmentIndex) => {
          const width = total > 0 ? (category.bytes / total) * 100 : 0;
          const color = categoryColor(category.id, segmentIndex);
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
              label={formatTooltipLabel(diskCategoryLabel(t, category.id), category.bytes, total)}
              className="h-full"
              style={{ width: `${width}%` }}
            >
              <span
                className={`block h-full w-full ${radius} transition-opacity hover:opacity-90`}
                style={{ backgroundColor: color }}
                aria-hidden
              />
            </Tooltip>
          );
        })}
      </div>

      <ul className="space-y-2">
        {visibleCategories.map((category, index) => {
          const color = categoryColor(category.id, index);
          return (
            <li
              key={category.id}
              className="flex justify-between gap-4 text-[13px]"
            >
              <span className="flex min-w-0 items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                {diskCategoryLabel(t, category.id)}
              </span>
              <span className="shrink-0 font-medium text-zinc-900 dark:text-zinc-100">
                {formatStorageSize(category.bytes)}
                <span className="ml-1.5 font-normal text-zinc-400">
                  ({formatPercent(category.bytes, total)}%)
                </span>
              </span>
            </li>
          );
        })}
        <li className="flex justify-between border-t border-zinc-100 pt-2 text-[13px] font-semibold dark:border-[var(--color-settings-border-dark)]">
          <span>{t("common:details.total")}</span>
          <span>{formatStorageSize(total)}</span>
        </li>
      </ul>
    </div>
  );
}

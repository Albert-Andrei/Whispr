import { ThemeToggle } from "../../components/ThemeToggle";
import { getConfig, setConfig } from "../../lib/db";
import { useTranscriptionStore } from "../dashboard/store";
import { useEffect, useState } from "react";

const EXPORT_OPTS = ["txt", "txt_timestamps", "srt", "pdf", "docx"] as const;

export function GeneralSettings() {
  const maxConcurrent = useTranscriptionStore((s) => s.maxConcurrent);
  const setMaxConcurrentJobs = useTranscriptionStore((s) => s.setMaxConcurrentJobs);
  const [exportDefault, setExportDefault] =
    useState<(typeof EXPORT_OPTS)[number]>("txt");

  useEffect(() => {
    void (async () => {
      const v = await getConfig("default_export_format");
      if (v && EXPORT_OPTS.includes(v as (typeof EXPORT_OPTS)[number]))
        setExportDefault(v as (typeof EXPORT_OPTS)[number]);
    })();
  }, []);

  const onExportChange = async (v: (typeof EXPORT_OPTS)[number]) => {
    setExportDefault(v);
    await setConfig("default_export_format", v);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Theme
        </p>
        <div className="mt-2 max-w-sm">
          <ThemeToggle />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Default export format
        </p>
        <select
          value={exportDefault}
          onChange={(e) =>
            void onExportChange(e.target.value as (typeof EXPORT_OPTS)[number])
          }
          className="mt-2 w-full max-w-sm rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          {EXPORT_OPTS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Max concurrent transcriptions (1–3)
        </label>
        <div className="mt-2 flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={3}
            step={1}
            value={maxConcurrent}
            onChange={(e) =>
              void setMaxConcurrentJobs(Number.parseInt(e.target.value, 10))
            }
            className="w-full max-w-xs"
          />
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {maxConcurrent}
          </span>
        </div>
      </div>
    </div>
  );
}

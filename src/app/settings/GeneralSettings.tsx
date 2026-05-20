import { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import type { ThemePreference } from "../../lib/theme";
import { getConfig, setConfig } from "../../lib/db";
import { useTranscriptionStore } from "../dashboard/store";
import { SettingsRow, SettingsSelect } from "./SettingsLayout";

const EXPORT_OPTS = [
  { value: "txt", label: "Plain text" },
  { value: "txt_timestamps", label: "Text with timestamps" },
  { value: "srt", label: "SRT subtitles" },
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "Word (DOCX)" },
] as const;

const THEME_OPTS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const CONCURRENT_OPTS = [
  { value: "1", label: "1 job" },
  { value: "2", label: "2 jobs" },
  { value: "3", label: "3 jobs" },
];

export function GeneralSettings() {
  const { preference, setPreference } = useTheme();
  const maxConcurrent = useTranscriptionStore((state) => state.maxConcurrent);
  const setMaxConcurrentJobs = useTranscriptionStore(
    (state) => state.setMaxConcurrentJobs,
  );
  const [exportDefault, setExportDefault] =
    useState<(typeof EXPORT_OPTS)[number]["value"]>("txt");

  useEffect(() => {
    void (async () => {
      const value = await getConfig("default_export_format");
      if (
        value &&
        EXPORT_OPTS.some((option) => option.value === value)
      ) {
        setExportDefault(value as (typeof EXPORT_OPTS)[number]["value"]);
      }
    })();
  }, []);

  const onExportChange = async (value: string) => {
    const format = value as (typeof EXPORT_OPTS)[number]["value"];
    setExportDefault(format);
    await setConfig("default_export_format", format);
  };

  return (
    <>
      <SettingsRow
        label="Color theme"
        description="Choose light, dark, or match your system appearance"
      >
        <SettingsSelect
          value={preference}
          onChange={(value) => setPreference(value as ThemePreference)}
          options={THEME_OPTS}
        />
      </SettingsRow>
      <SettingsRow
        label="Default export format"
        description="Format used when exporting transcripts from the dashboard"
      >
        <SettingsSelect
          value={exportDefault}
          onChange={(value) => void onExportChange(value)}
          options={[...EXPORT_OPTS]}
        />
      </SettingsRow>
      <SettingsRow
        label="Concurrent transcriptions"
        description="How many jobs can run at the same time (1–3)"
        last
      >
        <SettingsSelect
          value={String(maxConcurrent)}
          onChange={(value) =>
            void setMaxConcurrentJobs(Number.parseInt(value, 10))
          }
          options={CONCURRENT_OPTS}
        />
      </SettingsRow>
    </>
  );
}

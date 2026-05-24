import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../hooks/useTheme";
import type { ThemePreference } from "../../lib/theme";
import { getConfig, setConfig } from "../../lib/db";
import {
  getAppLocale,
  setAppLocale,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "../../lib/i18n";
import { useTranscriptionStore } from "../dashboard/store";
import { SettingsRow, SettingsSelect } from "./SettingsLayout";

export function GeneralSettings() {
  const { t } = useTranslation(["common", "app"]);
  const { preference, setPreference } = useTheme();
  const maxConcurrent = useTranscriptionStore((state) => state.maxConcurrent);
  const setMaxConcurrentJobs = useTranscriptionStore(
    (state) => state.setMaxConcurrentJobs,
  );
  const [exportDefault, setExportDefault] = useState<
    "txt" | "txt_timestamps" | "srt" | "pdf" | "docx"
  >("txt");
  const [locale, setLocale] = useState<AppLocale>(() => getAppLocale());

  const exportOpts = [
    { value: "txt", label: t("common:exportFormats.txt") },
    { value: "txt_timestamps", label: t("common:exportFormats.txtTimestamps") },
    { value: "srt", label: t("common:exportFormats.srt") },
    { value: "pdf", label: t("common:exportFormats.pdf") },
    { value: "docx", label: t("common:exportFormats.docx") },
  ] as const;

  const themeOpts: { value: ThemePreference; label: string }[] = [
    { value: "light", label: t("common:theme.light") },
    { value: "dark", label: t("common:theme.dark") },
    { value: "system", label: t("common:theme.system") },
  ];

  const concurrentOpts = [
    { value: "1", label: t("common:concurrentJobs.one") },
    { value: "2", label: t("common:concurrentJobs.two") },
    { value: "3", label: t("common:concurrentJobs.three") },
  ];

  const languageOpts = SUPPORTED_LOCALES.map((code) => ({
    value: code,
    label: t(`common:languages.${code}`),
  }));

  useEffect(() => {
    void (async () => {
      const value = await getConfig("default_export_format");
      if (value && exportOpts.some((option) => option.value === value)) {
        setExportDefault(value as (typeof exportOpts)[number]["value"]);
      }
      const storedLocale = await getConfig("locale");
      if (
        storedLocale &&
        SUPPORTED_LOCALES.includes(storedLocale as AppLocale)
      ) {
        setLocale(storedLocale as AppLocale);
      }
    })();
  }, []);

  const onExportChange = async (value: string) => {
    const format = value as (typeof exportOpts)[number]["value"];
    setExportDefault(format);
    await setConfig("default_export_format", format);
  };

  const onLocaleChange = async (value: string) => {
    const lng = value as AppLocale;
    setLocale(lng);
    await setAppLocale(lng);
  };

  return (
    <>
      <SettingsRow
        label={t("app:settings.general.language.label")}
        description={t("app:settings.general.language.description")}
      >
        <SettingsSelect
          value={locale}
          onChange={(value) => void onLocaleChange(value)}
          options={languageOpts}
        />
      </SettingsRow>
      <SettingsRow
        label={t("common:theme.colorTheme")}
        description={t("common:theme.colorThemeDescription")}
      >
        <SettingsSelect
          value={preference}
          onChange={(value) => setPreference(value as ThemePreference)}
          options={themeOpts}
        />
      </SettingsRow>
      <SettingsRow
        label={t("app:settings.general.exportFormat.label")}
        description={t("app:settings.general.exportFormat.description")}
      >
        <SettingsSelect
          value={exportDefault}
          onChange={(value) => void onExportChange(value)}
          options={[...exportOpts]}
        />
      </SettingsRow>
      <SettingsRow
        label={t("app:settings.general.concurrent.label")}
        description={t("app:settings.general.concurrent.description")}
        last
      >
        <SettingsSelect
          value={String(maxConcurrent)}
          onChange={(value) =>
            void setMaxConcurrentJobs(Number.parseInt(value, 10))
          }
          options={concurrentOpts}
        />
      </SettingsRow>
    </>
  );
}

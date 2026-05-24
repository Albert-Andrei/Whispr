import { useState } from "react";
import type { ReactNode } from "react";
import { Menu } from "@base-ui-components/react/menu";
import { useTranslation } from "react-i18next";
import {
  copyTranscriptText,
  TRANSLATE_LANGUAGES,
} from "../../lib/transcriptActions";
import { sourceTypeLabel } from "../../lib/i18nLabels";
import type { TranscriptionJob } from "./types";

const EXPORT_FORMATS = [
  { id: "txt", labelKey: "common:exportFormats.txtWithExt", ext: ".txt" },
  { id: "txt_timestamps", labelKey: "common:exportFormats.txtTimestamps", ext: ".txt" },
  { id: "srt", labelKey: "common:exportFormats.srtWithExt", ext: ".srt" },
  { id: "pdf", labelKey: "common:exportFormats.pdfWithExt", ext: ".pdf" },
  { id: "docx", labelKey: "common:exportFormats.docxWithExt", ext: ".docx" },
] as const;

export type ExportFormatId = (typeof EXPORT_FORMATS)[number]["id"];

const ROW_BTN =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-800/60";

function IconCopy() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconTranslate() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 1.5 1.5" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

function IconChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`ml-auto shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function SideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <p className="mb-2 px-0.5 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <div className="overflow-hidden rounded-lg border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-[var(--color-content-border-dark)] dark:bg-[var(--color-content-surface-dark)] dark:shadow-none">
        {children}
      </div>
    </section>
  );
}

type TranscriptSidePanelProps = {
  job: TranscriptionJob;
  copyText: string;
  onExport: (format: ExportFormatId) => void;
  onTranslate: (langCode: string, langLabel: string) => void;
  translating?: boolean;
  selectedLang?: string | null;
};

export function TranscriptSidePanel({
  job,
  copyText,
  onExport,
  onTranslate,
  translating = false,
  selectedLang = null,
}: TranscriptSidePanelProps) {
  const { t, i18n } = useTranslation(["common", "app"]);
  const [copyLabel, setCopyLabel] = useState(t("common:actions.copyText"));

  const transcriptText = job.transcript?.trim() ?? "";
  const actionsDisabled = transcriptText.length === 0;
  const canCopy = copyText.length > 0;

  const handleCopy = async () => {
    if (!canCopy) return;
    await copyTranscriptText(copyText);
    setCopyLabel(t("common:actions.copied"));
    window.setTimeout(() => setCopyLabel(t("common:actions.copyText")), 2000);
  };

  const handleTranslate = (langCode: string, langLabel: string) => {
    if (actionsDisabled || translating) return;
    onTranslate(langCode, langLabel);
  };

  const detailRows: { label: string; value: string }[] = [
    { label: t("common:details.source"), value: sourceTypeLabel(t, job.source_type) },
    {
      label: t("common:details.created"),
      value: new Date(job.created_at).toLocaleString(i18n.language),
    },
  ];

  if (job.duration) {
    detailRows.push({ label: t("common:details.duration"), value: job.duration });
  }
  if (job.model_used) {
    detailRows.push({ label: t("common:details.model"), value: job.model_used });
  }

  return (
    <aside className="flex w-[272px] shrink-0 flex-col gap-4 bg-white p-4 pt-2 dark:bg-[var(--color-content-bg-dark)]">
      <section>
        <p className="mb-2 px-0.5 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
          {t("common:sections.actions")}
        </p>
        <div className="rounded-lg border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-[var(--color-content-border-dark)] dark:bg-[var(--color-content-surface-dark)] dark:shadow-none">
          <div className="flex flex-col gap-1 p-1.5">
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!canCopy}
              className={ROW_BTN}
            >
              <IconCopy />
              {copyLabel}
            </button>

            <Menu.Root modal={false}>
              <Menu.Trigger
                disabled={actionsDisabled || translating}
                render={(props, state) => (
                  <button {...props} type="button" className={ROW_BTN}>
                    <IconTranslate />
                    {translating ? t("common:translating") : t("common:actions.translate")}
                    <IconChevronDown open={state.open} />
                  </button>
                )}
              />
              <Menu.Portal>
                <Menu.Positioner side="bottom" align="start" sideOffset={4}>
                  <Menu.Popup className="max-h-48 w-[var(--anchor-width)] overflow-y-auto rounded-md border border-zinc-200/90 bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.1)] outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                    {TRANSLATE_LANGUAGES.map((lang) => (
                      <Menu.Item
                        key={lang.code}
                        label={lang.label}
                        disabled={translating}
                        onClick={() => handleTranslate(lang.code, lang.label)}
                        className={`cursor-default px-3 py-1.5 text-left text-[13px] text-zinc-700 outline-none data-[highlighted]:bg-zinc-100 dark:text-zinc-200 dark:data-[highlighted]:bg-zinc-700/80 ${
                          selectedLang === lang.code
                            ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-700/80 dark:text-zinc-100"
                            : ""
                        }`}
                      >
                        {lang.label}
                      </Menu.Item>
                    ))}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        </div>
      </section>

      <SideSection title={t("common:sections.exportAs")}>
        <div className="flex flex-col gap-1 p-1.5">
          {EXPORT_FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              onClick={() => onExport(format.id)}
              className={ROW_BTN}
            >
              <IconDownload />
              {t(format.labelKey)}
            </button>
          ))}
        </div>
      </SideSection>

      <SideSection title={t("common:sections.details")}>
        <dl className="flex flex-col gap-2 px-3 py-3">
          {detailRows.map((row) => (
            <div key={row.label}>
              <dt className="text-[12px] text-zinc-500 dark:text-zinc-400">
                {row.label}
              </dt>
              <dd
                className={`mt-0.5 text-[13px] font-medium text-zinc-900 dark:text-zinc-100 ${
                  row.label === "Source" ? "capitalize" : ""
                } ${row.label === "Model" ? "break-all font-normal" : ""}`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </SideSection>
    </aside>
  );
}

export { EXPORT_FORMATS };

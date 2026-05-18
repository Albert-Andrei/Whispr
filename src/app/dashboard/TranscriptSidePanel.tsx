import type { ReactNode } from "react";
import type { TranscriptionJob } from "./types";

const EXPORT_FORMATS = [
  { id: "txt", label: "Plain text (.txt)", ext: ".txt" },
  { id: "txt_timestamps", label: "Text with timestamps", ext: ".txt" },
  { id: "srt", label: "Subtitles (.srt)", ext: ".srt" },
  { id: "pdf", label: "PDF (.pdf)", ext: ".pdf" },
  { id: "docx", label: "Word (.docx)", ext: ".docx" },
] as const;

export type ExportFormatId = (typeof EXPORT_FORMATS)[number]["id"];

const SIDE_CARD_CLASS =
  "overflow-hidden rounded-lg border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-[var(--color-content-border-dark)] dark:bg-[var(--color-content-surface-dark)] dark:shadow-none";

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
      <div className={SIDE_CARD_CLASS}>{children}</div>
    </section>
  );
}

type TranscriptSidePanelProps = {
  job: TranscriptionJob;
  onExport: (format: ExportFormatId) => void;
};

export function TranscriptSidePanel({
  job,
  onExport,
}: TranscriptSidePanelProps) {
  const detailRows: { label: string; value: string }[] = [
    { label: "Source", value: job.source_type },
    {
      label: "Created",
      value: new Date(job.created_at).toLocaleString(),
    },
  ];

  if (job.duration) {
    detailRows.push({ label: "Duration", value: job.duration });
  }
  if (job.model_used) {
    detailRows.push({ label: "Model", value: job.model_used });
  }

  return (
    <aside className="flex w-[272px] shrink-0 flex-col gap-4 bg-white p-4 pt-6 dark:bg-[var(--color-content-bg-dark)]">
      <SideSection title="Export as">
        <div className="flex flex-col gap-1 p-1.5">
          {EXPORT_FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              onClick={() => onExport(format.id)}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.98] dark:text-zinc-200 dark:hover:bg-zinc-800/60"
            >
              <IconDownload />
              {format.label}
            </button>
          ))}
        </div>
      </SideSection>

      <SideSection title="Details">
        <dl className="flex flex-col gap-3 px-3 py-3">
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

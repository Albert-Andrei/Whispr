import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { useTranscriptionStore } from "./store";

const EXPORT_FORMATS = [
  { id: "txt", label: "Plain text (.txt)", ext: ".txt" },
  { id: "txt_timestamps", label: "Text with timestamps", ext: ".txt" },
  { id: "srt", label: "Subtitles (.srt)", ext: ".srt" },
  { id: "pdf", label: "PDF (.pdf)", ext: ".pdf" },
  { id: "docx", label: "Word (.docx)", ext: ".docx" },
] as const;

export function TranscriptView() {
  const jobs = useTranscriptionStore((s) => s.jobs);
  const selectedId = useTranscriptionStore((s) => s.selectedJobId);
  const setSelected = useTranscriptionStore((s) => s.setSelectedJob);

  const job = jobs.find((j) => j.id === selectedId);
  if (!job) return null;

  const baseName = job.filename.replace(/[^\w\-.]+/g, "_").slice(0, 80);

  const exportAs = async (format: (typeof EXPORT_FORMATS)[number]["id"]) => {
    const fmt = EXPORT_FORMATS.find((f) => f.id === format);
    const path = await save({
      defaultPath: `${baseName}${fmt?.ext ?? ".txt"}`,
      filters:
        format === "srt"
          ? [{ name: "SRT", extensions: ["srt"] }]
          : format === "pdf"
            ? [{ name: "PDF", extensions: ["pdf"] }]
            : format === "docx"
              ? [{ name: "Word", extensions: ["docx"] }]
              : [{ name: "Text", extensions: ["txt"] }],
    });
    if (!path) return;
    await invoke("export_transcript", {
      jobId: job.id,
      format,
      outputPath: path,
    });
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 min-h-0 flex-1 flex-col border-r border-zinc-200 dark:border-zinc-800">
        <div className="flex shrink-0 items-center gap-3 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800/90">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← Back
          </button>
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {job.filename}
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {job.transcript ?? "—"}
          </pre>
        </div>
      </div>

      <aside className="flex w-[260px] shrink-0 flex-col gap-6 p-5">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Export
          </h3>
          <div className="mt-3 flex flex-col gap-2">
            {EXPORT_FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => void exportAs(f.id)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-left text-[13px] font-medium text-zinc-800 transition hover:border-indigo-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-indigo-500 dark:hover:bg-zinc-900"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Details
          </h3>
          <dl className="mt-3 space-y-2 text-[13px] text-zinc-600 dark:text-zinc-400">
            <div>
              <dt className="text-zinc-400">Source</dt>
              <dd className="capitalize">{job.source_type}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">Created</dt>
              <dd>{new Date(job.created_at).toLocaleString()}</dd>
            </div>
            {job.duration ? (
              <div>
                <dt className="text-zinc-400">Duration</dt>
                <dd>{job.duration}</dd>
              </div>
            ) : null}
            {job.model_used ? (
              <div>
                <dt className="text-zinc-400">Model</dt>
                <dd className="break-all">{job.model_used}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </aside>
    </div>
  );
}

import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { exportDefaultBaseName } from "../../lib/exportFilename";
import {
  EXPORT_FORMATS,
  TranscriptSidePanel,
  type ExportFormatId,
} from "./TranscriptSidePanel";
import { useTranscriptionStore } from "./store";

export function TranscriptView() {
  const jobs = useTranscriptionStore((state) => state.jobs);
  const selectedId = useTranscriptionStore((state) => state.selectedJobId);
  const job = jobs.find((j) => j.id === selectedId);
  if (!job) return null;

  const baseName = exportDefaultBaseName(job.filename);

  const exportAs = async (format: ExportFormatId) => {
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
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 py-6">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {job.transcript ?? "—"}
        </pre>
      </div>

      <TranscriptSidePanel
        job={job}
        onExport={(format) => void exportAs(format)}
      />
    </div>
  );
}

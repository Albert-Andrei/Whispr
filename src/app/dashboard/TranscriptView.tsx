import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { exportDefaultBaseName } from "../../lib/exportFilename";
import { translateTranscriptText } from "../../lib/transcriptActions";
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

  const [translation, setTranslation] = useState<{
    lang: string;
    label: string;
    text: string;
  } | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  useEffect(() => {
    setTranslation(null);
    setTranslateError(null);
    setTranslating(false);
  }, [job?.id]);

  if (!job) return null;

  const baseName = exportDefaultBaseName(job.filename);
  const transcriptText = job.transcript?.trim() ?? "";
  const displayText = translation?.text ?? job.transcript ?? "—";

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

  const handleTranslate = async (langCode: string, langLabel: string) => {
    if (!transcriptText) return;
    setTranslating(true);
    setTranslateError(null);
    try {
      const translated = await translateTranscriptText(
        transcriptText,
        langCode,
      );
      setTranslation({ lang: langCode, label: langLabel, text: translated });
    } catch {
      setTranslateError("Translation failed. Check your connection and try again.");
      setTranslation(null);
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 py-6">
        {translation ? (
          <div className="mb-3 flex items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400">
            <span>Translated to {translation.label}</span>
            <button
              type="button"
              onClick={() => {
                setTranslation(null);
                setTranslateError(null);
              }}
              className="text-zinc-700 underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-900 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-zinc-100"
            >
              Show original
            </button>
          </div>
        ) : null}

        {translateError ? (
          <p className="mb-3 text-[13px] text-red-600 dark:text-red-400">
            {translateError}
          </p>
        ) : null}

        {translating ? (
          <p className="mb-3 text-[13px] text-zinc-500 dark:text-zinc-400">
            Translating…
          </p>
        ) : null}

        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {displayText}
        </pre>
      </div>

      <TranscriptSidePanel
        job={job}
        onExport={(format) => void exportAs(format)}
        onTranslate={(langCode, langLabel) => void handleTranslate(langCode, langLabel)}
        translating={translating}
        selectedLang={translation?.lang ?? null}
      />
    </div>
  );
}

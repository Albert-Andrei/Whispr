import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { exportDefaultBaseName } from "../../lib/exportFilename";
import { parseSrt } from "../../lib/srt";
import {
  translateLanguageLabel,
  translateTranscriptText,
} from "../../lib/transcriptActions";
import { useTranscriptPlayback } from "../../hooks/useTranscriptPlayback";
import {
  EXPORT_FORMATS,
  TranscriptSidePanel,
  type ExportFormatId,
} from "./TranscriptSidePanel";
import { TranscriptPlayer } from "./TranscriptPlayer";
import { TranscriptSegments } from "./TranscriptSegments";
import { setJobTranslation } from "./db";
import { useTranscriptionStore } from "./store";

export function TranscriptView() {
  const jobs = useTranscriptionStore((state) => state.jobs);
  const selectedId = useTranscriptionStore((state) => state.selectedJobId);
  const patchJob = useTranscriptionStore((state) => state.patchJob);
  const job = jobs.find((j) => j.id === selectedId);

  const [viewingOriginal, setViewingOriginal] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  useEffect(() => {
    setViewingOriginal(false);
    setTranslateError(null);
    setTranslating(false);
  }, [job?.id]);

  const srtRaw = job?.srt_output ?? "";
  const segments = useMemo(() => parseSrt(srtRaw), [srtRaw]);

  const hasSavedTranslation = Boolean(
    job?.translated_text?.trim() && job?.translated_lang,
  );
  const showTranslation = hasSavedTranslation && !viewingOriginal;

  const canPlay = !showTranslation && !!job?.audio_path && segments.length > 0;

  const playback = useTranscriptPlayback(
    canPlay ? job.audio_path : null,
    segments,
  );

  if (!job) return null;

  const translatedLabel = job.translated_lang
    ? translateLanguageLabel(job.translated_lang)
    : null;

  const baseName = exportDefaultBaseName(job.filename);
  const transcriptText = job.transcript?.trim() ?? "";
  const displayText = showTranslation
    ? (job.translated_text?.trim() ?? "—")
    : transcriptText || "—";

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

  const handleTranslate = async (langCode: string, _langLabel: string) => {
    if (!transcriptText) return;
    setTranslating(true);
    setTranslateError(null);
    try {
      const translated = await translateTranscriptText(
        transcriptText,
        langCode,
      );
      if (!translated.trim()) {
        setTranslateError("Translation returned no text. Try again.");
        return;
      }
      await setJobTranslation(job.id, translated, langCode);
      patchJob(job.id, {
        translated_text: translated,
        translated_lang: langCode,
      });
      setViewingOriginal(false);
    } catch {
      setTranslateError("Translation failed. Check your connection and try again.");
    } finally {
      setTranslating(false);
    }
  };

  const showSegments = canPlay && segments.length > 0;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="relative min-h-0 min-w-0 flex-1">
        {hasSavedTranslation ? (
          <div className="flex items-center gap-2 px-5 pt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
            {showTranslation ? (
              <>
                <span>Translated to {translatedLabel}</span>
                <button
                  type="button"
                  onClick={() => setViewingOriginal(true)}
                  className="text-zinc-700 underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-900 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-zinc-100"
                >
                  Show original
                </button>
              </>
            ) : (
              <>
                <span>Showing original</span>
                <button
                  type="button"
                  onClick={() => setViewingOriginal(false)}
                  className="text-zinc-700 underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-900 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-zinc-100"
                >
                  Show translation
                </button>
              </>
            )}
          </div>
        ) : null}

        {translateError ? (
          <p className="px-5 pt-2 text-[13px] text-red-600 dark:text-red-400">
            {translateError}
          </p>
        ) : null}

        {translating ? (
          <p className="px-5 pt-2 text-[13px] text-zinc-500 dark:text-zinc-400">
            Translating…
          </p>
        ) : null}

        {showSegments ? (
          <TranscriptSegments
            segments={segments}
            activeIndex={playback.activeIdx}
            onSeek={playback.seek}
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              {displayText}
            </pre>
          </div>
        )}

        {canPlay ? (
          <TranscriptPlayer
            playing={playback.playing}
            currentTime={playback.currentTime}
            duration={playback.duration}
            speed={playback.speed}
            volume={playback.volume}
            expanded={playback.expanded}
            onTogglePlay={playback.togglePlay}
            onSeekFraction={playback.seekFraction}
            onSetSpeed={playback.setSpeed}
            onSetVolume={playback.setVolume}
          />
        ) : null}
      </div>

      <TranscriptSidePanel
        job={job}
        copyText={displayText === "—" ? "" : displayText}
        onExport={(format) => void exportAs(format)}
        onTranslate={(langCode, langLabel) => void handleTranslate(langCode, langLabel)}
        translating={translating}
        selectedLang={job.translated_lang}
      />
    </div>
  );
}

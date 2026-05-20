import { useEffect, useRef } from "react";
import type { LiveSegment } from "./types";
import { RecordSessionPlayer } from "./RecordSessionPlayer";

type LiveRecordViewProps = {
  segments: LiveSegment[];
  paused: boolean;
  elapsedMs: number;
  level: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDiscard: () => void;
};

export function LiveRecordView({
  segments,
  paused,
  elapsedMs,
  level,
  onPause,
  onResume,
  onStop,
  onDiscard,
}: LiveRecordViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [segments.length]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-y-auto px-5 py-6 pb-24"
      >
        {segments.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Start speaking to see live transcription…
          </p>
        ) : (
          segments.map((seg, i) => (
            <span
              key={`${seg.startMs}-${i}`}
              className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
            >
              {seg.text}{" "}
            </span>
          ))
        )}
      </div>

      <RecordSessionPlayer
        paused={paused}
        elapsedMs={elapsedMs}
        level={level}
        onPause={onPause}
        onResume={onResume}
        onStop={onStop}
        onDiscard={onDiscard}
      />
    </div>
  );
}

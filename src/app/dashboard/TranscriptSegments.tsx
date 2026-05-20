import { useEffect, useRef, useCallback } from "react";
import type { SrtSegment } from "../../lib/srt";

type TranscriptSegmentsProps = {
  segments: SrtSegment[];
  activeIndex: number;
  onSeek: (timeMs: number) => void;
};

const SCROLL_COOLDOWN_MS = 3000;

export function TranscriptSegments({
  segments,
  activeIndex,
  onSeek,
}: TranscriptSegmentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastManualScroll = useRef(0);
  const prevActiveRef = useRef(-1);

  const handleScroll = useCallback(() => {
    lastManualScroll.current = Date.now();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (activeIndex < 0 || activeIndex === prevActiveRef.current) return;
    prevActiveRef.current = activeIndex;

    const elapsed = Date.now() - lastManualScroll.current;
    if (elapsed < SCROLL_COOLDOWN_MS) return;

    const el = containerRef.current?.querySelector(
      `[data-seg="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className="min-h-0 flex-1 overflow-y-auto px-5 py-6 pt-2 pb-24"
    >
      {segments.map((seg) => {
        const isActive = seg.index === activeIndex;
        return (
          <span
            key={seg.index}
            data-seg={seg.index}
            onClick={() => onSeek(seg.startMs)}
            className={`cursor-pointer rounded-sm px-0.5 transition-colors duration-200 ${
              isActive
                ? "bg-blue-100 text-zinc-900 dark:bg-blue-500/20 dark:text-zinc-50"
                : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/40"
            }`}
          >
            {seg.text}{" "}
          </span>
        );
      })}
    </div>
  );
}

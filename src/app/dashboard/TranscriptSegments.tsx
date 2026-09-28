import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SrtSegment } from "../../lib/srt";

type TranscriptSegmentsProps = {
  segments: SrtSegment[];
  activeIndex: number;
  playing: boolean;
  onSeek: (timeMs: number) => void;
};

/** Scroll events within this window after wheel/touch/key/scrollbar input count as the user's. */
const USER_INPUT_WINDOW_MS = 600;
const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

/**
 * Transcript text that follows playback. Scrolling away detaches the follow;
 * scrolling back to the highlighted segment (or pressing play / clicking a
 * segment) snaps to it and resumes following.
 */
export function TranscriptSegments({
  segments,
  activeIndex,
  playing,
  onSeek,
}: TranscriptSegmentsProps) {
  const { t } = useTranslation("common");
  const containerRef = useRef<HTMLDivElement>(null);
  const [following, setFollowing] = useState(true);
  const followingRef = useRef(true);
  const lastUserInput = useRef(0);
  const pointerDown = useRef(false);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const setFollow = useCallback((value: boolean) => {
    followingRef.current = value;
    setFollowing(value);
  }, []);

  const activeElement = useCallback(() => {
    const idx = activeIndexRef.current;
    if (idx < 0) return null;
    return containerRef.current?.querySelector<HTMLElement>(
      `[data-seg="${idx}"]`,
    );
  }, []);

  const isActiveVisible = useCallback(() => {
    const container = containerRef.current;
    const el = activeElement();
    if (!container || !el) return false;
    const c = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return r.bottom > c.top && r.top < c.bottom;
  }, [activeElement]);

  const scrollToActive = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      activeElement()?.scrollIntoView({ block: "center", behavior });
    },
    [activeElement],
  );

  const snapToActive = useCallback(() => {
    setFollow(true);
    scrollToActive();
  }, [scrollToActive, setFollow]);

  // Track real user scroll intent so our own smooth scrolling never detaches the follow.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const markInput = () => {
      lastUserInput.current = Date.now();
    };
    const onKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) markInput();
    };
    const onPointerDown = () => {
      pointerDown.current = true;
      markInput();
    };
    const onPointerUp = () => {
      pointerDown.current = false;
    };
    const onScroll = () => {
      const byUser =
        pointerDown.current ||
        Date.now() - lastUserInput.current < USER_INPUT_WINDOW_MS;
      if (!byUser) return;
      if (isActiveVisible()) {
        // Came back to the playing part while detached: snap and keep following.
        if (!followingRef.current) snapToActive();
      } else if (followingRef.current) {
        setFollow(false);
      }
    };

    el.addEventListener("wheel", markInput, { passive: true });
    el.addEventListener("touchmove", markInput, { passive: true });
    el.addEventListener("keydown", onKey);
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("wheel", markInput);
      el.removeEventListener("touchmove", markInput);
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("scroll", onScroll);
    };
  }, [isActiveVisible, setFollow, snapToActive]);

  // Follow the highlighted segment while attached; re-attach when playback
  // reaches the part the user scrolled to.
  useEffect(() => {
    if (activeIndex < 0) return;
    if (followingRef.current) {
      if (Date.now() - lastUserInput.current < USER_INPUT_WINDOW_MS) return;
      scrollToActive();
    } else if (isActiveVisible()) {
      setFollow(true);
    }
  }, [activeIndex, isActiveVisible, scrollToActive, setFollow]);

  // Pressing play always brings the playing part into view.
  useEffect(() => {
    if (playing) snapToActive();
  }, [playing, snapToActive]);

  const showJumpButton = playing && !following && activeIndex >= 0;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={containerRef}
        tabIndex={-1}
        className="min-h-0 flex-1 overflow-y-auto px-5 py-6 pt-2 pb-24 text-sm leading-relaxed outline-none"
      >
        {segments.map((seg) => {
          const isActive = seg.index === activeIndex;
          return (
            <span
              key={seg.index}
              data-seg={seg.index}
              onClick={() => {
                setFollow(true);
                onSeek(seg.startMs);
              }}
              className={`cursor-pointer rounded-sm px-0.5 transition-colors duration-200 ${
                isActive
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/40"
              }`}
            >
              {seg.text}{" "}
            </span>
          );
        })}
      </div>

      {showJumpButton ? (
        <button
          type="button"
          onClick={snapToActive}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full border border-zinc-200/80 bg-white/95 px-3 py-1 text-[12px] font-medium text-zinc-700 shadow-md backdrop-blur-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {t("playback.jumpToCurrent")}
        </button>
      ) : null}
    </div>
  );
}

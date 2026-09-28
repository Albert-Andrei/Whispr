import { useCallback, useEffect, useRef, useState } from "react";

/** Resync the separate audio stream when it drifts further than this from the video. */
const MAX_DRIFT_SECS = 0.3;

/**
 * Drives the clip editor preview. With both a video and an audio URL (YouTube
 * serves them split) the video is the clock and the audio follows it.
 */
export function useClipPlayer(videoUrl: string | null, audioUrl: string | null) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stopAtRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const master = useCallback(
    (): HTMLMediaElement | null => (videoUrl ? videoRef.current : audioRef.current),
    [videoUrl],
  );
  const follower = useCallback(
    (): HTMLMediaElement | null => (videoUrl && audioUrl ? audioRef.current : null),
    [videoUrl, audioUrl],
  );

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setMediaDuration(null);
    setFailed(false);
    setPreviewing(false);
    stopAtRef.current = null;

    const m = master();
    if (!m) return;
    const f = follower();

    const onTime = () => {
      setCurrentTime(m.currentTime);
      if (f && Math.abs(f.currentTime - m.currentTime) > MAX_DRIFT_SECS) {
        f.currentTime = m.currentTime;
      }
      const stopAt = stopAtRef.current;
      if (stopAt !== null && m.currentTime >= stopAt) {
        stopAtRef.current = null;
        setPreviewing(false);
        m.pause();
      }
    };
    const onPlay = () => {
      setPlaying(true);
      if (f) {
        f.currentTime = m.currentTime;
        void f.play().catch(() => {});
      }
    };
    const onPause = () => {
      setPlaying(false);
      f?.pause();
    };
    const onWaiting = () => f?.pause();
    const onPlaying = () => {
      if (f && f.paused) void f.play().catch(() => {});
    };
    const onSeeking = () => {
      if (f) f.currentTime = m.currentTime;
    };
    const onMeta = () => {
      if (Number.isFinite(m.duration)) setMediaDuration(m.duration);
    };
    const onError = () => setFailed(true);

    m.addEventListener("timeupdate", onTime);
    m.addEventListener("play", onPlay);
    m.addEventListener("pause", onPause);
    m.addEventListener("waiting", onWaiting);
    m.addEventListener("playing", onPlaying);
    m.addEventListener("seeking", onSeeking);
    m.addEventListener("loadedmetadata", onMeta);
    m.addEventListener("error", onError);
    return () => {
      m.removeEventListener("timeupdate", onTime);
      m.removeEventListener("play", onPlay);
      m.removeEventListener("pause", onPause);
      m.removeEventListener("waiting", onWaiting);
      m.removeEventListener("playing", onPlaying);
      m.removeEventListener("seeking", onSeeking);
      m.removeEventListener("loadedmetadata", onMeta);
      m.removeEventListener("error", onError);
      m.pause();
      f?.pause();
    };
  }, [master, follower]);

  const seek = useCallback(
    (secs: number) => {
      const m = master();
      if (!m) return;
      m.currentTime = Math.max(0, secs);
      setCurrentTime(m.currentTime);
    },
    [master],
  );

  const togglePlay = useCallback(() => {
    const m = master();
    if (!m) return;
    stopAtRef.current = null;
    setPreviewing(false);
    if (m.paused) void m.play().catch(() => setFailed(true));
    else m.pause();
  }, [master]);

  /** Plays just the selected section, then stops at its end. */
  const playRange = useCallback(
    (start: number, end: number) => {
      const m = master();
      if (!m) return;
      stopAtRef.current = end;
      setPreviewing(true);
      m.currentTime = start;
      void m.play().catch(() => setFailed(true));
    },
    [master],
  );

  const stop = useCallback(() => {
    stopAtRef.current = null;
    setPreviewing(false);
    master()?.pause();
  }, [master]);

  return {
    videoRef,
    audioRef,
    playing,
    previewing,
    currentTime,
    mediaDuration,
    failed,
    seek,
    togglePlay,
    playRange,
    stop,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { SrtSegment } from "../lib/srt";
import { activeSegmentIndex } from "../lib/srt";

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export function useTranscriptPlayback(
  audioPath: string | null,
  segments: SrtSegment[],
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [volume, setVolumeState] = useState(0.5);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!audioPath) return;

    const audio = new Audio(convertFileSrc(audioPath));
    audio.preload = "metadata";
    audio.volume = volume;
    audioRef.current = audio;

    const onLoaded = () => setDuration(audio.duration);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const ms = audio.currentTime * 1000;
      setActiveIdx(activeSegmentIndex(segments, ms));
    };
    const onEnded = () => {
      setPlaying(false);
      setExpanded(false);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, [audioPath, segments]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
      setPlaying(true);
      setExpanded(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, []);

  const seek = useCallback((timeMs: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = timeMs / 1000;
    setCurrentTime(audio.currentTime);
    setActiveIdx(activeSegmentIndex(segments, timeMs));
  }, [segments]);

  const seekFraction = useCallback((fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const t = fraction * duration;
    audio.currentTime = t;
    setCurrentTime(t);
    setActiveIdx(activeSegmentIndex(segments, t * 1000));
  }, [duration, segments]);

  return {
    playing,
    currentTime,
    duration,
    speed,
    setSpeed,
    volume,
    setVolume,
    activeIdx,
    expanded,
    setExpanded,
    togglePlay,
    seek,
    seekFraction,
  };
}

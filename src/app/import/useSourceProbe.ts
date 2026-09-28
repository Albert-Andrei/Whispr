import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { extensionOf } from "./constants";
import type { ImportSource } from "./types";

type UrlProbe = {
  title: string | null;
  durationSecs: number | null;
  thumbnail: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
};

type LocalProbe = { durationSecs: number | null; hasVideo: boolean };

export type SourceProbe = {
  status: "loading" | "ready" | "error";
  error: string | null;
  title: string | null;
  durationSecs: number | null;
  thumbnail: string | null;
  /** Stream with picture (and sound unless `audioUrl` is also set). */
  videoUrl: string | null;
  /** Separate sound stream kept in sync with `videoUrl`, or the only stream. */
  audioUrl: string | null;
  /** The file type can't be previewed in the app's web view. */
  unplayable: boolean;
};

/** Formats WebKit plays straight from disk. */
const PLAYABLE_VIDEO = new Set(["mp4", "mov", "webm"]);
const PLAYABLE_AUDIO = new Set(["mp3", "wav", "m4a", "aac", "flac"]);

const LOADING: SourceProbe = {
  status: "loading",
  error: null,
  title: null,
  durationSecs: null,
  thumbnail: null,
  videoUrl: null,
  audioUrl: null,
  unplayable: false,
};

/** YouTube stream links expire after a few hours; re-read well before that. */
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { at: number; result: Promise<SourceProbe> }>();

function sourceKey(source: ImportSource): string {
  return source.kind === "url" ? `url:${source.url}` : `file:${source.path}`;
}

async function runProbe(source: ImportSource): Promise<SourceProbe> {
  try {
    if (source.kind === "url") {
      const p = await invoke<UrlProbe>("probe_url", { url: source.url });
      return {
        status: "ready",
        error: null,
        title: p.title,
        durationSecs: p.durationSecs,
        thumbnail: p.thumbnail,
        videoUrl: p.videoUrl,
        audioUrl: p.audioUrl,
        unplayable: !p.videoUrl && !p.audioUrl,
      };
    }

    const p = await invoke<LocalProbe>("probe_local_media", { path: source.path });
    const ext = extensionOf(source.name);
    const src = convertFileSrc(source.path);
    const video = p.hasVideo && PLAYABLE_VIDEO.has(ext);
    const audio = !p.hasVideo && PLAYABLE_AUDIO.has(ext);
    return {
      status: "ready",
      error: null,
      title: source.name,
      durationSecs: p.durationSecs,
      thumbnail: null,
      videoUrl: video ? src : null,
      audioUrl: audio ? src : null,
      unplayable: !video && !audio,
    };
  } catch (err) {
    return {
      ...LOADING,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Starts (or reuses) the probe for a source. Results are kept for an hour so
 * reopening a "Not started" draft shows its preview right away.
 */
export function probeSource(source: ImportSource): Promise<SourceProbe> {
  const key = sourceKey(source);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.result;
  const result = runProbe(source).then((probe) => {
    // Don't keep failures: the next open should try again.
    if (probe.status === "error") cache.delete(key);
    return probe;
  });
  cache.set(key, { at: Date.now(), result });
  return result;
}

/** Reads title, length and preview streams for a link or local file. */
export function useSourceProbe(source: ImportSource): SourceProbe {
  const [probe, setProbe] = useState<SourceProbe>(LOADING);
  const key = sourceKey(source);

  useEffect(() => {
    let stale = false;
    setProbe(LOADING);
    void probeSource(source).then((result) => {
      if (!stale) setProbe(result);
    });
    return () => {
      stale = true;
    };
  }, [key]);

  return probe;
}

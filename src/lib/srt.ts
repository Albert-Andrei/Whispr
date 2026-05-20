export interface SrtSegment {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

function parseTimestamp(ts: string): number {
  // "HH:MM:SS,mmm" or "HH:MM:SS.mmm"
  const parts = ts.trim().replace(",", ".").split(":");
  if (parts.length !== 3) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const secParts = parts[2].split(".");
  const s = parseInt(secParts[0], 10) || 0;
  const ms = parseInt((secParts[1] ?? "0").padEnd(3, "0").slice(0, 3), 10) || 0;
  return (h * 3600 + m * 60 + s) * 1000 + ms;
}

export function parseSrt(srt: string): SrtSegment[] {
  const segments: SrtSegment[] = [];
  const blocks = srt.trim().split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;
    const timeLine = lines[1];
    if (!timeLine.includes("-->")) continue;
    const [startStr, endStr] = timeLine.split("-->");
    if (!startStr || !endStr) continue;
    const text = lines.slice(2).join(" ").trim();
    if (!text) continue;
    segments.push({
      index: segments.length,
      startMs: parseTimestamp(startStr),
      endMs: parseTimestamp(endStr),
      text,
    });
  }
  return segments;
}

/** Binary-search for the active segment at a given time in ms. Returns -1 if none. */
export function activeSegmentIndex(segments: SrtSegment[], timeMs: number): number {
  if (segments.length === 0) return -1;
  let lo = 0;
  let hi = segments.length - 1;
  let result = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (segments[mid].startMs <= timeMs) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (result >= 0 && timeMs < segments[result].endMs) {
    return result;
  }
  return -1;
}

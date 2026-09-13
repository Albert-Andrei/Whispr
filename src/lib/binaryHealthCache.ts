import type { BinaryHealthReport } from "../types/types";

const CACHE_KEY = "whispr.binaryHealth";

export function readBinaryHealthCache(): BinaryHealthReport | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BinaryHealthReport;
  } catch {
    return null;
  }
}

export function writeBinaryHealthCache(report: BinaryHealthReport) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(report));
  } catch {
    /* ignore */
  }
}

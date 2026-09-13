import { invoke, isTauri } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import {
  readBinaryHealthCache,
  writeBinaryHealthCache,
} from "../lib/binaryHealthCache";
import type { BinaryHealthReport } from "../types/types";

export function prefetchBinaryHealth() {
  if (!isTauri()) return;
  void invoke<BinaryHealthReport>("check_binaries")
    .then(writeBinaryHealthCache)
    .catch(() => {});
}

export function useBinaryHealth() {
  const [health, setHealth] = useState<BinaryHealthReport | null>(() =>
    readBinaryHealthCache(),
  );
  const [checking, setChecking] = useState(() => isTauri());

  const refresh = useCallback(async () => {
    if (!isTauri()) return;
    setChecking(true);
    try {
      const report = await invoke<BinaryHealthReport>("check_binaries");
      setHealth(report);
      writeBinaryHealthCache(report);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { health, checking, refresh };
}

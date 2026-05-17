import { isTauri } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

/** True when running in Tauri on macOS (traffic-light overlay layout). */
export function useIsMacTauri(): boolean {
  const [mac, setMac] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;
    setMac(/Mac OS X|Macintosh/i.test(navigator.userAgent));
  }, []);

  return mac;
}

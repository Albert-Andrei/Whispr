import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

/** Overlay / transparent title bars often ignore `-webkit-app-region: drag`; use this too. */
export function windowDragPointerDown(e: { target: EventTarget | null }): void {
  const t = e.target;
  if (!(t instanceof Element)) return;
  if (t.closest("button, a, input, textarea, select, [data-tauri-no-drag]")) {
    return;
  }
  if (!isTauri()) return;
  void getCurrentWindow().startDragging();
}

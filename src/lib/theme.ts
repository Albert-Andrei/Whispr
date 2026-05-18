import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const THEME_STORAGE_KEY = "whispr.theme";

/** Matches `--color-chrome-bg-*` in `index.css` (native window layer behind WebView). */
const NATIVE_CHROME_LIGHT = "#f3f3f4";
const NATIVE_CHROME_DARK = "#111113";

export type ThemeMode = "light" | "dark";
export type ThemePreference = "light" | "dark" | "system";

export function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

export function resolveEffectiveTheme(preference: ThemePreference): ThemeMode {
  if (preference === "system") return getSystemTheme();
  return preference;
}

function syncNativeWindowBackground(mode: ThemeMode): void {
  if (!isTauri()) return;
  const color = mode === "dark" ? NATIVE_CHROME_DARK : NATIVE_CHROME_LIGHT;
  void getCurrentWindow().setBackgroundColor(color).catch(() => {
    /* ignore: permission or platform quirks */
  });
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = mode === "dark" ? "dark" : "light";
  syncNativeWindowBackground(mode);
}

export function persistThemePreference(preference: ThemePreference): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function applyStoredTheme(): void {
  applyTheme(resolveEffectiveTheme(getStoredThemePreference()));
}

import { useCallback, useEffect, useState } from "react";
import {
  applyTheme,
  getStoredThemePreference,
  persistThemePreference,
  resolveEffectiveTheme,
  type ThemeMode,
  type ThemePreference,
} from "../lib/theme";

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    typeof window !== "undefined" ? getStoredThemePreference() : "system",
  );

  const [effectiveMode, setEffectiveMode] = useState<ThemeMode>(() =>
    typeof window !== "undefined"
      ? resolveEffectiveTheme(getStoredThemePreference())
      : "light",
  );

  const syncFromPreference = useCallback((pref: ThemePreference) => {
    const effective = resolveEffectiveTheme(pref);
    applyTheme(effective);
    setEffectiveMode(effective);
  }, []);

  useEffect(() => {
    syncFromPreference(preference);
  }, [preference, syncFromPreference]);

  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => syncFromPreference("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference, syncFromPreference]);

  const setPreference = useCallback((pref: ThemePreference) => {
    persistThemePreference(pref);
    setPreferenceState(pref);
  }, []);

  return { preference, effectiveMode, setPreference };
}

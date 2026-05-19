import { invoke } from "@tauri-apps/api/core";

export const TRANSLATE_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ro", label: "Romanian" },
  { code: "ru", label: "Russian" },
  { code: "uk", label: "Ukrainian" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
] as const;

export function translateLanguageLabel(code: string): string {
  return TRANSLATE_LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

export async function translateTranscriptText(
  text: string,
  targetLang: string,
): Promise<string> {
  return invoke<string>("translate_text", {
    text,
    targetLang,
  });
}

export async function copyTranscriptText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

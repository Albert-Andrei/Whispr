/** Lowercase extensions without dot */
export const ACCEPTED_VIDEO_EXTENSIONS = new Set([
  "mp4",
  "mov",
  "mkv",
  "webm",
  "avi",
]);

export const ACCEPTED_AUDIO_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "m4a",
  "flac",
  "ogg",
  "aac",
]);

export const ACCEPTED_EXTENSIONS = new Set([
  ...ACCEPTED_VIDEO_EXTENSIONS,
  ...ACCEPTED_AUDIO_EXTENSIONS,
]);

/** Extension list for `plugin-dialog` `open({ filters })` — no leading dot. */
export const DIALOG_MEDIA_EXTENSIONS: string[] = [...ACCEPTED_EXTENSIONS].sort();

export const DIALOG_MEDIA_FILTER = {
  name: "Video & audio",
  extensions: DIALOG_MEDIA_EXTENSIONS,
} as const;

export function extensionOf(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx === -1) return "";
  return name.slice(idx + 1).toLowerCase();
}

export function isAcceptedMediaFile(file: File): boolean {
  return ACCEPTED_EXTENSIONS.has(extensionOf(file.name));
}

export function isAcceptedMediaPath(path: string): boolean {
  const name = path.replace(/\\/g, "/").split("/").pop() ?? path;
  return ACCEPTED_EXTENSIONS.has(extensionOf(name));
}

export const ACCEPT_INPUT_ATTRIBUTE =
  ".mp4,.mov,.mkv,.webm,.avi,.mp3,.wav,.m4a,.flac,.ogg,.aac";

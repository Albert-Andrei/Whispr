/** Characters invalid in file names on common desktop OSes. */
const UNSAFE_FILENAME_CHARS = /[/\\:\0<>|"?*]/g;

/**
 * Default base name for export save dialogs — matches the UI title, without
 * aggressive ASCII-only sanitization.
 */
export function exportDefaultBaseName(displayName: string): string {
  const leaf = displayName.replace(/^.*[/\\]/, "").trim() || "transcript";
  const withoutExt = leaf.replace(/\.[^./\\]+$/, "");
  const name = (withoutExt || leaf).replace(UNSAFE_FILENAME_CHARS, "").trim();
  return name.slice(0, 120) || "transcript";
}

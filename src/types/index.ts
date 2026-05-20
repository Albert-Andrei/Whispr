/**
 * Shared app-wide types. Prefer colocating types under `src/app/<module>/`
 * until a second module needs them.
 */
export type SidebarView = "history" | "settings" | "record" | "media";

/** Which part of the import modal to emphasize when opened (e.g. from dashboard CTAs). */
export type NewImportStep = "url" | "local";

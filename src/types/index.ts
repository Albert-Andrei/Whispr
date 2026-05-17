/**
 * Shared app-wide types. Prefer colocating types under `src/app/<module>/`
 * until a second module needs them.
 */
export type SidebarView = "history" | "settings" | "record";

export type NewImportStep = "choose" | "url" | "local";

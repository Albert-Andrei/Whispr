# AGENTS.md — Whispr

Context for AI agents and contributors working on this repo.

## Product

**Whispr** is a macOS desktop app for transcribing video and audio to text, 100% offline (no API keys, cloud, or subscriptions). First iteration focuses on shell UI, import flows, and local persistence; transcription pipelines (yt-dlp, ffmpeg, whisper.cpp) come later.

## Stack

- **Tauri v2** (Rust) + **React 19** + **TypeScript** + **Vite 7**
- **Bun** for JS package management and scripts in `package.json`
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Base UI** (`@base-ui-components/react`) for accessible headless primitives (e.g. Dialog)
- **Zustand** for client state
- **SQLite** via `@tauri-apps/plugin-sql` / `tauri-plugin-sql` (DB file under app data; path `sqlite:whispr.db`)

## Project layout

- **`src/components/`** — Shared shell only: `AppShell`, `Sidebar`, `Header`, `ThemeToggle`.
- **`src/app/<module>/`** — Feature modules. Each owns its UI and module-specific `store.ts` / `types.ts` / `db.ts` when appropriate. Do not use `features/`; the convention is **`app/`**.
- **`src/lib/`** — Shared utilities (`db.ts` connection + schema migration, `theme.ts`).
- **`src/hooks/`** — Shared hooks (`useTheme.ts`).
- **`src/types/`** — Cross-cutting types only (e.g. `SidebarView`, modal step unions).

**Rule:** Keep code inside the module that owns it until a second module needs it; then promote to `components/`, `lib/`, `hooks/`, or `types/`.

## UI / UX conventions

- **Native macOS feel:** traffic lights, resizable window, full screen via system chrome (`decorations: true`, `resizable: true`).
- **Sidebar:** Resizable (default ~240px, min 180, max 360), width persisted in `localStorage` (`whispr.sidebar.width`).
- **Theme:** Light + dark; class `dark` on `<html>`. User choice stored under `whispr.theme`; initial load falls back to `prefers-color-scheme`.
- **History / dashboard:** Empty state offers “Import from URL” and “Import local file”; with items, **New** opens the same flow in a modal.

## Data model

SQLite table `transcription_jobs` (see `src/lib/db.ts`): id, filename, source_type (`local` | `url`), paths/URLs, optional size & duration, status (`pending` | `processing` | `completed` | `failed`), transcript, timestamps.

## Supported media (import validation)

- **Video:** `mp4`, `mov`, `mkv`, `webm`, `avi`
- **Audio:** `mp3`, `wav`, `m4a`, `flac`, `ogg`, `aac`

## Commands

- `bun install` — install JS deps
- `bun run dev` — Vite dev server (also used by Tauri `beforeDevCommand`)
- `bun run build` — typecheck + Vite production build
- `bun run tauri dev` / `bun run tauri build` — Tauri app

## Conventions for agents

- Prefer **small, focused** files under `src/app/<module>/`.
- **Do not** add cloud services or API keys for core transcription flows.
- When adding DB columns, extend the migration in `src/lib/db.rs` (additive migrations / new `CREATE` guards) and update `src/app/dashboard/types.ts` + `db.ts` helpers.
- Match existing **Tailwind** utility style; keep contrast acceptable in both themes.

Enjoy the quiet.

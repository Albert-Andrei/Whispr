# AGENTS.md — Whispr

Context for AI agents and contributors working on this repo.

## Product

**Whispr** is a macOS desktop app for transcribing video and audio to text, **offline by default** (no API keys or cloud for core transcription). The **transcription pipeline** runs in **Rust** (Tauri): URL fetch via **yt-dlp**, audio via **ffmpeg**, inference via **`whisper-cli`** (whisper.cpp), with progress streamed to the React UI.

## Transcription stack (implemented)

- **yt-dlp** — downloaded on demand into the app config layout (not shipped in the bundle in current iteration). **Each launch** re-checks `bin/yt-dlp`; if it is missing, empty, or unreadable it is downloaded again (quietly, no setup progress events).
- **ffmpeg** — same; **each launch** verifies `bin/ffmpeg` and re-downloads when needed.
- **whisper-cli** — **not** bundled. On macOS, Whispr runs **`brew install whisper-cpp`** when needed (if Homebrew is at `/opt/homebrew/bin/brew` or `/usr/local/bin/brew`), then symlinks `whisper-cli` into `bin/`. Each launch also repairs a missing/broken symlink when the binary is already on disk. Users without Homebrew need to install it from [brew.sh](https://brew.sh) once, or provide `whisper-cli` on the `PATH` / standard install paths.
- **Models** — GGML `.bin` files (small / medium / large-v3) downloaded from Hugging Face URLs in Rust (`downloader.rs`); stored under the app’s models directory.

### Language / errors

- Pipeline stages and errors are persisted on `transcription_jobs` (`pipeline_stage`, `error_message`, `progress`). Failures should surface in the dashboard row and transcript flow where applicable—avoid silent failures for user-triggered work.

## Stack

- **Tauri v2** (Rust) + **React 19** + **TypeScript** + **Vite 7**
- **Bun** for JS package management and scripts in `package.json`
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Base UI** (`@base-ui-components/react`) for accessible headless primitives (e.g. Dialog)
- **Zustand** for client state
- **SQLite** via `@tauri-apps/plugin-sql` — DB file: `sqlite:whispr.db` (resolved under **`app_config_dir`/whispr.db**, aligned with the Rust `paths::db_path` helper)

## Project layout

- **`src/components/`** — Shared shell: `AppShell` (setup gate + main chrome), `Sidebar`, `Header`, `ThemeToggle`.
- **`src/app/<module>/`** — Feature modules (`dashboard`, `import`, `settings`, `setup`, `record`, …). Each owns UI and module-specific `store.ts` / `types.ts` / `db.ts` when appropriate.
- **`src/lib/`** — Shared utilities (`db.ts` — `app_config` + migrations, `theme.ts`).
- **`src/hooks/`** — Shared hooks.
- **`src/types/`** — Cross-cutting types (e.g. `SidebarView`).

**`src-tauri/src/`** (Rust):

- **`lib.rs`** — Tauri app entry; registers commands.
- **`paths.rs`** — App config dirs, `bin/`, `models/`, `tmp/`, DB path, whisper-cli symlink target.
- **`binaries.rs`** — `check_binaries`, `get_app_disk_usage`, `get_recommended_max_concurrent`, `list_model_files`, `delete_model_file`.
- **`jobs_db.rs`** — Direct SQLite access from Rust for job updates (must stay consistent with TS schema in `src/lib/db.ts`).
- **`downloader.rs`** — `download_tools`, `download_model_file`, setup progress events.
- **`pipeline/`** — Orchestration: download → extract audio → `whisper-cli` → write transcript / SRT; emits `pipeline:progress`.
- **`export/`** — `export_transcript` — txt, timestamped txt, srt, **pdf** (`printpdf`), **docx** (`docx-rs`).

**Rule:** Keep code inside the module that owns it until a second module needs it; then promote to `components/`, `lib/`, `hooks/`, or `types/`.

## First-run setup

- **`AppShell`** reads `app_config.setup_completed`. If unset/false in Tauri, **`SetupScreen`** runs (model tier pick, `download_tools`, `download_model_file`, then `setup_completed=true` and `selected_model`).
- After setup (or when already complete), the shell initializes pipeline event listeners, refreshes `max_concurrent_jobs`, and loads jobs.

## `app_config` keys (SQLite)

| Key | Purpose |
|-----|--------|
| `setup_completed` | `"true"` after first-run wizard |
| `selected_model` | Filename, e.g. `ggml-medium.bin` |
| `max_concurrent_jobs` | `"1"`–`"3"` |
| `default_export_format` | `txt` / `txt_timestamps` / `srt` / `pdf` / `docx` |

## Data model

SQLite `transcription_jobs` (see `src/lib/db.ts` migrations): core fields plus **`error_message`**, **`progress`**, **`pipeline_stage`**, **`srt_output`**, **`model_used`**.

## Tauri commands (Rust)

- `check_binaries` — `BinaryHealthReport` (ffmpeg, yt-dlp, whisper-cli).
- `get_app_disk_usage` — rough category breakdown + total.
- `get_recommended_max_concurrent` — CPU-based hint (capped 1–3).
- `download_tools`, `download_model_file`, `delete_model_file`, `list_model_files`.
- `run_pipeline` — start job pipeline (by `jobId` + source fields).
- `export_transcript` — write chosen format to user path (dialog from frontend).

Events: **`pipeline:progress`**, **`setup:progress`**.

## UI / UX conventions

- **Native macOS feel:** traffic lights, resizable window, system chrome (`decorations: true`, `resizable: true`).
- **Sidebar:** Resizable; width persisted in `localStorage` (`whispr.sidebar.width`).
- **Theme:** Light + dark; class `dark` on `<html>`. User choice in `whispr.theme`.
- **Dashboard:** Import modal; pipeline progress on rows; **TranscriptView** for completed jobs with export actions.

## Supported media (import validation)

- **Video:** `mp4`, `mov`, `mkv`, `webm`, `avi`
- **Audio:** `mp3`, `wav`, `m4a`, `flac`, `ogg`, `aac`

## Commands

- `bun install` — install JS deps
- `bun run dev` — Vite only (SQLite/plugins need Tauri for real behavior)
- `bun run build` — typecheck + Vite production build
- `bun run tauri dev` / `bun run tauri build` — full desktop app
- **`cargo check`** — from `src-tauri/` (or per project docs)

## Conventions for agents

- Prefer **small, focused** files under `src/app/<module>/`.
- **Do not** add cloud services or API keys for **core** transcription flows unless explicitly product-approved.
- When adding DB columns, extend migrations in **`src/lib/db.ts`** and keep **`src-tauri/src/jobs_db.rs`** in sync for Rust writes; update **`src/app/dashboard/types.ts`** + **`db.ts`** helpers.
- Match existing **Tailwind** utility style; keep contrast acceptable in both themes.

Enjoy the quiet.

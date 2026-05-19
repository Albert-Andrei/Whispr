# Whispr

**Whispr** is a macOS desktop app for turning video and audio into text — **offline by default**. Import a file or paste a link, and Whispr handles the rest on your Mac using local AI (Whisper via [whisper.cpp](https://github.com/ggerganov/whisper.cpp)).

No API keys. No cloud transcription. Your media stays on your machine.

---

## What it does

Whispr is built for people who want transcripts without sending money and recordings to a third-party service.

- **Transcribe local files** — drag and drop or pick video/audio from your Mac
- **Transcribe from URLs** — YouTube and other sites supported via yt-dlp
- **Work offline** — after first-run setup, transcription runs entirely on-device
- **Manage jobs** — track progress, rename files, view transcripts in a clean dashboard
- **Export anywhere** — plain text, timestamped text, SRT, PDF, or Word (DOCX)
- **Translate transcripts** — optional online translation to common languages (uses Lingva; requires internet)
- **Light & dark mode** — matches your preference or system appearance

### Supported formats

| Video                    | Audio                         |
| ------------------------ | ----------------------------- |
| MP4, MOV, MKV, WebM, AVI | MP3, WAV, M4A, FLAC, OGG, AAC |

### Whisper models

On first launch you pick a model tier:

| Model      | Size    | Best for                  |
| ---------- | ------- | ------------------------- |
| **Small**  | ~466 MB | Faster runs, good quality |
| **Medium** | ~1.5 GB | Recommended balance       |
| **Large**  | ~3.1 GB | Highest accuracy          |

You can change the model later in **Settings**.

---

## How it works

Whispr runs a local pipeline in Rust (Tauri):

1. **Download** (URLs only) — yt-dlp fetches the media
2. **Extract audio** — ffmpeg converts to the format Whisper expects
3. **Transcribe** — `whisper-cli` runs inference with your chosen GGML model
4. **Save & export** — transcript and optional SRT are stored in a local SQLite database

On first run, Whispr downloads **ffmpeg**, **yt-dlp**, and your chosen Whisper model. If `whisper-cli` is not already on your Mac, Whispr installs it via **Homebrew** (`brew install whisper-cpp`).

---

## Download & install

### Requirements

- **macOS** (Apple Silicon or Intel)
- **Homebrew** — [brew.sh](https://brew.sh) (needed for `whisper-cli` on first setup)
- **Internet** — only for first-run downloads, URL imports, translation, and update checks
- **Disk space** — model size plus working room for temp files (see **Settings → Storage** in the app)

### Install from a release

1. Open **[Releases](https://github.com/Albert-Andrei/Whispr/releases)** on GitHub.
2. Download the `.dmg` for your Mac:
   - **Apple Silicon (M1/M2/M3/M4)** → `aarch64` build
   - **Intel** → `x86_64` build
3. Open the DMG and drag **Whispr** into **Applications**.
4. Launch Whispr and complete the one-time setup wizard.

### Build from source

For developers or if you prefer to run an unsigned local build:

```bash
# Prerequisites: Bun, Rust, Xcode Command Line Tools
#   xcode-select --install
#   curl -fsSL https://bun.sh/install | bash

git clone https://github.com/Albert-Andrei/Whispr.git
cd Whispr
bun install
bun run tauri dev    # development
bun run tauri build  # production .app + .dmg in src-tauri/target/.../bundle/
```

---

## First launch

1. **Setup wizard** — choose a Whisper model; Whispr downloads tools and the model (this can take several minutes).
2. **Homebrew / whisper-cli** — if Whisper is not installed yet, setup may run `brew install whisper-cpp`. The first Homebrew install can take a while.
3. **Dashboard** — import a file or URL and start transcribing.

After setup, day-to-day transcription works **offline**. You only need internet again for URL imports, translation, or checking for app updates.

---

## Troubleshooting

### “Whispr cannot be opened because the developer cannot be verified”

Whispr is distributed **without Apple Developer ID signing or notarization** (no paid Apple certificate yet). macOS Gatekeeper blocks apps from unidentified developers by default. The app is not broken — macOS is being cautious.

**Try these in order:**

#### Option 1 — Right-click Open (easiest)

1. Open **Finder → Applications**.
2. **Right-click** (or Control-click) **Whispr**.
3. Choose **Open**.
4. Click **Open** in the dialog (this only needs to be done once).

#### Option 2 — System Settings

1. Try opening Whispr normally (it will be blocked).
2. Open **System Settings → Privacy & Security**.
3. Scroll down; you should see a message about Whispr being blocked.
4. Click **Open Anyway**, then confirm.

#### Option 3 — Remove quarantine flag

Downloads from a browser are tagged with a quarantine attribute. Sometimes macOS shows **“Whispr is damaged and can’t be opened”** — that usually means quarantine, not a corrupt file.

Run in **Terminal**:

```bash
xattr -dr com.apple.quarantine /Applications/Whispr.app
```

Then open Whispr again (Option 1 or double-click).

#### Option 4 — Run from Terminal (diagnostics)

If the app still will not start, run it directly to see error output:

```bash
/Applications/Whispr.app/Contents/MacOS/whispr
```

Copy any error message when opening an issue on GitHub.

> **Note:** Removing Gatekeeper checks (`sudo spctl --master-disable`) is not recommended. The steps above are the safe approach for unsigned indie apps.

---

### App opens but transcription fails

| Symptom                     | What to try                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **whisper-cli missing**     | Install [Homebrew](https://brew.sh), then `brew install whisper-cpp`. Restart Whispr. Check **Settings → Components**.             |
| **ffmpeg / yt-dlp missing** | Quit and reopen Whispr (it re-downloads on launch). Or delete `~/Library/Application Support/com.albert.whispr/bin/` and relaunch. |
| **URL import fails**        | Confirm the link is public and supported by yt-dlp. Check your internet connection.                                                |
| **Slow or stuck jobs**      | Large files and the Large model need time. Lower concurrent jobs in **Settings** if your Mac is under heavy load.                  |
| **Out of disk space**       | Remove unused models in **Settings → Models**, or delete old jobs from the dashboard.                                              |

Whispr stores data under:

```text
~/Library/Application Support/com.albert.whispr/
├── whispr.db      # jobs & settings
├── bin/           # ffmpeg, yt-dlp, whisper-cli
├── models/        # Whisper GGML models
└── tmp/           # working files during jobs
```

---

## Roadmap

What is planned or in progress:

| Feature                                    | Status                                                    |
| ------------------------------------------ | --------------------------------------------------------- |
| **Live recording / dictation**             | Coming soon (sidebar placeholder today)                   |
| **Apple Developer signing & notarization** | Planned — removes Gatekeeper warnings for release builds  |
| **Windows support**                        | Explored in codebase; macOS is the primary target for now |

Core transcription will stay **offline-first**. Optional features like translation may use the network, but sending your audio to a cloud API for transcription is not the goal.

---

## Privacy

- **Transcription** runs locally on your Mac.
- **Transcripts and jobs** are stored in a local SQLite database on your machine.
- **Translation** sends text to a public Lingva instance over HTTPS (not your audio).
- **Update checks** contact GitHub Releases for version info only.

---

## Development

| Command               | Description                                  |
| --------------------- | -------------------------------------------- |
| `bun install`         | Install JavaScript dependencies              |
| `bun run dev`         | Vite dev server only (limited without Tauri) |
| `bun run tauri dev`   | Full desktop app in development              |
| `bun run tauri build` | Production build (.app + .dmg)               |
| `cargo check`         | Rust typecheck (from `src-tauri/`)           |

Stack: **Tauri 2**, **Rust**, **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, **SQLite**.

---

## License

See the repository license file for terms.

---

**Enjoy the quiet.**

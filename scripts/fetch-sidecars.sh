#!/usr/bin/env bash
set -euo pipefail

# Fetch / build the sidecar binaries that Tauri bundles into Whispr.app.
# Apple Silicon only (aarch64-apple-darwin).
#
# Output (git-ignored):
#   src-tauri/binaries/ffmpeg-aarch64-apple-darwin
#   src-tauri/binaries/yt-dlp-aarch64-apple-darwin
#   src-tauri/binaries/whisper-cli-aarch64-apple-darwin
#
# Tauri copies each file into Whispr.app/Contents/MacOS/ *without* the
# "-aarch64-apple-darwin" suffix; the app then copies them into its own bin/
# directory on launch (see src-tauri/src/tools.rs).
#
# Every binary is checked to be arm64, to link only against system libraries,
# to actually run, and is ad-hoc signed.
#
# Usage:  ./scripts/fetch-sidecars.sh [--force]

TARGET="aarch64-apple-darwin"
MACOS_MIN="13.0"

# Pinned upstream versions
FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-arm64"
# yt-dlp is deliberately taken from the latest release at build time: it must
# stay fresh for sites like YouTube to keep working.
YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
WHISPER_CPP_REPO="https://github.com/ggml-org/whisper.cpp"
WHISPER_CPP_TAG="v1.9.4"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$SCRIPT_DIR/../src-tauri/binaries"
FORCE="${1:-}"
mkdir -p "$DEST"

for tool in curl git cmake codesign file otool; do
  command -v "$tool" >/dev/null 2>&1 || { echo "ERROR: '$tool' is required" >&2; exit 1; }
done

log() { printf '\n==> %s\n' "$*"; }

present() {
  [[ "$FORCE" != "--force" && -s "$1" ]]
}

download() {
  local url="$1" out="$2"
  curl -fL --retry 3 --retry-delay 2 --progress-bar -o "$out.part" "$url"
  mv "$out.part" "$out"
  chmod 755 "$out"
}

# ── ffmpeg (static build) ────────────────────────────────────────────
fetch_ffmpeg() {
  local out="$DEST/ffmpeg-$TARGET"
  if present "$out"; then echo "  ffmpeg already present"; return; fi
  echo "  downloading $FFMPEG_URL"
  download "$FFMPEG_URL" "$out"
}

# ── yt-dlp (PyInstaller one-file, universal) ─────────────────────────
fetch_ytdlp() {
  local out="$DEST/yt-dlp-$TARGET"
  if present "$out"; then echo "  yt-dlp already present"; return; fi
  echo "  downloading $YTDLP_URL"
  download "$YTDLP_URL" "$out"
}

# ── whisper-cli (built from source, fully static, Metal) ─────────────
build_whisper_cli() {
  local out="$DEST/whisper-cli-$TARGET"
  if present "$out"; then echo "  whisper-cli already present"; return; fi

  local work
  work="$(mktemp -d)"
  trap 'rm -rf "$work"' RETURN

  echo "  cloning whisper.cpp $WHISPER_CPP_TAG"
  git clone --quiet --depth 1 --branch "$WHISPER_CPP_TAG" "$WHISPER_CPP_REPO" "$work/src"

  echo "  configuring"
  cmake -S "$work/src" -B "$work/build" \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_OSX_ARCHITECTURES=arm64 \
    -DCMAKE_OSX_DEPLOYMENT_TARGET="$MACOS_MIN" \
    -DBUILD_SHARED_LIBS=OFF \
    -DGGML_NATIVE=OFF \
    -DGGML_METAL=ON \
    -DGGML_METAL_EMBED_LIBRARY=ON \
    -DGGML_ACCELERATE=ON \
    -DGGML_BLAS=OFF \
    -DGGML_OPENMP=OFF \
    -DGGML_CCACHE=OFF \
    -DWHISPER_BUILD_EXAMPLES=ON \
    -DWHISPER_BUILD_TESTS=OFF \
    -DWHISPER_BUILD_SERVER=OFF \
    -DWHISPER_SDL2=OFF \
    -DWHISPER_CURL=OFF \
    -DWHISPER_COREML=OFF \
    >/dev/null

  echo "  building whisper-cli"
  cmake --build "$work/build" --config Release --target whisper-cli \
    -j "$(sysctl -n hw.ncpu 2>/dev/null || echo 4)" >/dev/null

  local built="$work/build/bin/whisper-cli"
  [[ -f "$built" ]] || { echo "ERROR: whisper-cli not produced at $built" >&2; exit 1; }
  cp "$built" "$out"
  chmod 755 "$out"
}

# ── verification ─────────────────────────────────────────────────────
verify() {
  local name="$1" bin="$2" version_flag="$3"
  echo "  $name"

  # 1. Architecture
  if ! file "$bin" | grep -q 'arm64'; then
    echo "ERROR: $name is not an arm64 binary:" >&2; file "$bin" >&2; exit 1
  fi

  # 2. Only system libraries (anything else, e.g. Homebrew dylibs, would break
  #    on the user's machine)
  #    (`-arch arm64` + dropping the "path:" header lines handles universal
  #    binaries such as yt-dlp, which otool prints one section per slice)
  local bad
  bad="$(otool -arch arm64 -L "$bin" | grep -vE ':$' | awk '{print $1}' \
        | grep -v -E '^(/usr/lib/|/System/Library/)' || true)"
  if [[ -n "$bad" ]]; then
    echo "ERROR: $name links against non-system libraries:" >&2
    echo "$bad" >&2
    exit 1
  fi

  # 3. Ad-hoc signature (a fresh, consistent one; the loader needs *some*
  #    valid signature on arm64)
  codesign --force --sign - "$bin" 2>/dev/null

  # 4. It actually runs
  local rc=0
  "$bin" $version_flag >/dev/null 2>&1 || rc=$?
  if (( rc > 1 )); then
    echo "ERROR: $name failed to run ($version_flag exited with $rc)" >&2
    exit 1
  fi
}

log "Target: $TARGET  →  $DEST"

log "ffmpeg";       fetch_ffmpeg
log "yt-dlp";       fetch_ytdlp
log "whisper-cli";  build_whisper_cli

log "Verifying"
verify ffmpeg      "$DEST/ffmpeg-$TARGET"      "-version"
verify yt-dlp      "$DEST/yt-dlp-$TARGET"      "--version"
verify whisper-cli "$DEST/whisper-cli-$TARGET" "--help"

log "Done"
ls -lh "$DEST"/*-"$TARGET"

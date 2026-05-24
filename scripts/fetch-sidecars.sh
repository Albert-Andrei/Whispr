#!/usr/bin/env bash
set -euo pipefail

# Fetch/build sidecar binaries for Tauri bundling.
# Usage:  ./scripts/fetch-sidecars.sh [TARGET_TRIPLE]
# If TARGET_TRIPLE is omitted, it is detected from the current host.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$SCRIPT_DIR/../src-tauri/binaries"
mkdir -p "$DEST"

detect_triple() {
  local arch
  arch="$(uname -m)"
  case "$arch" in
    arm64) arch="aarch64" ;;
    x86_64) arch="x86_64" ;;
    *) echo "Unsupported arch: $arch" >&2; exit 1 ;;
  esac
  echo "${arch}-apple-darwin"
}

TARGET="${1:-$(detect_triple)}"
echo "==> Target triple: $TARGET"

# ── ffmpeg ──────────────────────────────────────────────────────────
fetch_ffmpeg() {
  local out="$DEST/ffmpeg-$TARGET"
  if [[ -f "$out" && -s "$out" ]]; then
    echo "  ffmpeg already present, skipping"
    return
  fi
  local url
  case "$TARGET" in
    aarch64-apple-darwin) url="https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-arm64" ;;
    x86_64-apple-darwin)  url="https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-x64" ;;
    *) echo "  No ffmpeg URL for $TARGET" >&2; return 1 ;;
  esac
  echo "  Downloading ffmpeg …"
  curl -fSL --progress-bar -o "$out" "$url"
  chmod 755 "$out"
}

# ── yt-dlp ──────────────────────────────────────────────────────────
fetch_ytdlp() {
  local out="$DEST/yt-dlp-$TARGET"
  if [[ -f "$out" && -s "$out" ]]; then
    echo "  yt-dlp already present, skipping"
    return
  fi
  local url
  case "$TARGET" in
    aarch64-apple-darwin|x86_64-apple-darwin)
      url="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
      ;;
    *) echo "  No yt-dlp URL for $TARGET" >&2; return 1 ;;
  esac
  echo "  Downloading yt-dlp …"
  curl -fSL --progress-bar -o "$out" "$url"
  chmod 755 "$out"
}

# ── whisper-cli (build from source) ─────────────────────────────────
build_whisper_cli() {
  local out="$DEST/whisper-cli-$TARGET"
  if [[ -f "$out" && -s "$out" ]]; then
    echo "  whisper-cli already present, skipping"
    return
  fi

  local tmpdir
  tmpdir="$(mktemp -d)"
  trap "rm -rf '$tmpdir'" EXIT

  echo "  Cloning whisper.cpp …"
  git clone --depth 1 https://github.com/ggerganov/whisper.cpp "$tmpdir/whisper.cpp"

  echo "  Building whisper-cli (Metal enabled) …"
  cmake -S "$tmpdir/whisper.cpp" -B "$tmpdir/build" \
    -DWHISPER_METAL=ON \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_OSX_ARCHITECTURES="$(echo "$TARGET" | cut -d- -f1 | sed 's/aarch64/arm64/')" \
    -DBUILD_SHARED_LIBS=OFF

  cmake --build "$tmpdir/build" --config Release -t whisper-cli -j "$(sysctl -n hw.ncpu 2>/dev/null || echo 4)"

  local built="$tmpdir/build/bin/whisper-cli"
  if [[ ! -f "$built" ]]; then
    echo "  ERROR: whisper-cli binary not found at $built" >&2
    exit 1
  fi
  cp "$built" "$out"
  chmod 755 "$out"
  echo "  whisper-cli built successfully"
}

echo "==> Fetching ffmpeg"
fetch_ffmpeg

echo "==> Fetching yt-dlp"
fetch_ytdlp

echo "==> Building whisper-cli"
build_whisper_cli

echo "==> Done. Sidecars in $DEST:"
ls -lh "$DEST"/*-"$TARGET" 2>/dev/null || echo "  (none found)"

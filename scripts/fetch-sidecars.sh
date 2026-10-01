#!/usr/bin/env bash
set -euo pipefail

# Fetch / build the sidecar binaries that Tauri bundles into Whispr.app.
# Apple Silicon only (aarch64-apple-darwin).
#
# Output (git-ignored):
#   src-tauri/binaries/ffmpeg-aarch64-apple-darwin
#   src-tauri/binaries/whisper-cli-aarch64-apple-darwin
#   src-tauri/binaries/yt-dlp-pkg/            (directory: launcher + _internal/)
#
# Tauri copies each single-file tool into Whispr.app/Contents/MacOS/ *without*
# the "-aarch64-apple-darwin" suffix, and the yt-dlp directory into
# Contents/Resources/yt-dlp/ (bundle.resources). The app then copies all of
# them into its own bin/ directory on launch (see src-tauri/src/tools.rs).
#
# yt-dlp is shipped as the *unpacked* (PyInstaller "onedir") build on purpose:
# the single-file build unpacks a whole Python runtime into a fresh temp folder
# on every run, and macOS's malware scan of those new files costs ~12 s per
# run. The unpacked folder is scanned once after install, then starts in
# ~0.3 s.
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
YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos.zip"
WHISPER_CPP_REPO="https://github.com/ggml-org/whisper.cpp"
WHISPER_CPP_TAG="v1.9.4"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$SCRIPT_DIR/../src-tauri/binaries"
FORCE="${1:-}"
mkdir -p "$DEST"

for tool in curl git cmake codesign file otool lipo unzip; do
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

# ── yt-dlp (PyInstaller one-dir, trimmed to arm64) ───────────────────
fetch_ytdlp() {
  local out="$DEST/yt-dlp-pkg"
  if [[ "$FORCE" != "--force" && -x "$out/yt-dlp" && -d "$out/_internal" ]]; then
    echo "  yt-dlp package already present"; return
  fi
  rm -rf "$out" "$out.tmp"
  local work
  work="$(mktemp -d)"
  trap 'rm -rf "$work"' RETURN

  echo "  downloading $YTDLP_URL"
  curl -fL --retry 3 --retry-delay 2 --progress-bar -o "$work/yt-dlp.zip" "$YTDLP_URL"
  unzip -q "$work/yt-dlp.zip" -d "$work/unzipped"

  # Zip layout: yt-dlp_macos (launcher) + _internal/ at the top level.
  # The launcher finds _internal/ next to itself whatever it is called.
  mkdir -p "$out.tmp"
  mv "$work/unzipped/yt-dlp_macos" "$out.tmp/yt-dlp"
  mv "$work/unzipped/_internal" "$out.tmp/_internal"
  chmod 755 "$out.tmp/yt-dlp"

  # Drop the x86_64 slices: we only ship Apple Silicon and this halves the
  # size. Each slice carries its own ad-hoc signature, which survives lipo
  # intact, so nothing is re-signed (codesign cannot re-sign the embedded
  # Python.framework anyway: "bundle format is ambiguous"). Every Mach-O is
  # verified instead, so a broken signature fails the build here, loudly.
  local f thinned=0 checked=0
  while IFS= read -r -d '' f; do
    if file "$f" | grep -q 'universal'; then
      lipo -thin arm64 "$f" -output "$f.thin"
      mv "$f.thin" "$f"
      thinned=$((thinned + 1))
    fi
    if file "$f" | grep -q 'Mach-O'; then
      # Verify a plain copy: inside a *.framework directory codesign treats
      # the path as a bundle and demands a resource seal the file never had.
      cp "$f" "$work/sigcheck.bin"
      if ! codesign --verify "$work/sigcheck.bin"; then
        echo "ERROR: invalid code signature after thinning: $f" >&2
        exit 1
      fi
      checked=$((checked + 1))
    fi
  done < <(find "$out.tmp" -type f -print0)
  echo "  thinned $thinned universal files, verified $checked Mach-O signatures"

  mv "$out.tmp" "$out"
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
verify yt-dlp      "$DEST/yt-dlp-pkg/yt-dlp"   "--version"
verify whisper-cli "$DEST/whisper-cli-$TARGET" "--help"
# No stray universal binaries left in the yt-dlp package.
if find "$DEST/yt-dlp-pkg" -type f -exec file {} + | grep -q 'universal'; then
  echo "ERROR: yt-dlp package still contains universal binaries" >&2; exit 1
fi

log "Done"
ls -lh "$DEST"/*-"$TARGET"
du -sh "$DEST/yt-dlp-pkg"

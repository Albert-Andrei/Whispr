use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

/// Single-file tools bundled as Tauri sidecars (see `bundle.externalBin` in
/// `tauri.conf.json` and `scripts/fetch-sidecars.sh`). yt-dlp is not one of
/// them: it ships as a directory, see [`bundled_ytdlp_dir`].
pub const TOOL_NAMES: [&str; 2] = ["ffmpeg", "whisper-cli"];

/// Directory name of the yt-dlp package, both in the bundle's resources and
/// inside `bin/`. It holds the `yt-dlp` launcher plus its `_internal/` runtime.
pub const YTDLP_DIR: &str = "yt-dlp";

pub fn app_root(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map_err(|e| e.to_string())
}

pub fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_root(app)?.join("whispr.db"))
}

/// Where the app keeps its own, runnable copies of the bundled tools.
///
/// The tools are copied here from the app bundle on launch (see `tools.rs`).
/// Running them from here rather than straight out of `Whispr.app` avoids the
/// macOS quarantine flag that every file inside a downloaded DMG carries, which
/// makes the kernel refuse to execute unsigned/ad-hoc-signed binaries.
pub fn bin_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_root(app)?.join("bin"))
}

pub fn models_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_root(app)?.join("models"))
}

pub fn tmp_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_root(app)?.join("tmp"))
}

pub fn audio_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_root(app)?.join("audio"))
}

/// Runnable copy of a bundled tool inside `bin/`.
pub fn tool_path(app: &AppHandle, name: &str) -> Result<PathBuf, String> {
    Ok(bin_dir(app)?.join(name))
}

pub fn ffmpeg_path(app: &AppHandle) -> Result<PathBuf, String> {
    tool_path(app, "ffmpeg")
}

/// Runnable yt-dlp launcher: `bin/yt-dlp/yt-dlp` (its runtime lives next to it).
pub fn ytdlp_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(ytdlp_dir(app)?.join("yt-dlp"))
}

/// The installed yt-dlp package directory inside `bin/`.
pub fn ytdlp_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(bin_dir(app)?.join(YTDLP_DIR))
}

/// The yt-dlp package as shipped: `Whispr.app/Contents/Resources/yt-dlp/` in a
/// release build (`bundle.resources`), or next to the target binary under
/// `tauri dev`, where tauri-build copies resources.
pub fn bundled_ytdlp_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let from_resources = app
        .path()
        .resource_dir()
        .map(|d| d.join(YTDLP_DIR))
        .ok()
        .filter(|d| d.join("yt-dlp").is_file());
    if let Some(d) = from_resources {
        return Ok(d);
    }
    // Fallbacks: next to the executable, then the raw fetch output in the
    // source tree (running `cargo run` straight from src-tauri).
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let beside = exe
        .parent()
        .map(|d| d.join(YTDLP_DIR))
        .filter(|d| d.join("yt-dlp").is_file());
    if let Some(d) = beside {
        return Ok(d);
    }
    Ok(PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("binaries")
        .join("yt-dlp-pkg"))
}

pub fn whisper_cli_path(app: &AppHandle) -> Result<PathBuf, String> {
    tool_path(app, "whisper-cli")
}

/// Location of a sidecar as shipped in the bundle.
///
/// Tauri copies each `externalBin` next to the main executable and strips the
/// target-triple suffix, so this is `Whispr.app/Contents/MacOS/<name>` in a
/// release build and `target/<profile>/<name>` under `tauri dev`.
pub fn bundled_tool_path(name: &str) -> Result<PathBuf, String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let dir = exe
        .parent()
        .ok_or_else(|| "Cannot determine executable directory".to_string())?;
    let plain = dir.join(name);
    if plain.is_file() {
        return Ok(plain);
    }
    // Fallback for running the raw binary from a directory that still has the
    // suffixed sidecar names (e.g. `src-tauri/binaries`).
    if let Some(triple) = option_env!("TAURI_ENV_TARGET_TRIPLE") {
        let suffixed = dir.join(format!("{name}-{triple}"));
        if suffixed.is_file() {
            return Ok(suffixed);
        }
    }
    Ok(plain)
}

pub fn ensure_layout(app: &AppHandle) -> Result<PathBuf, String> {
    let root = app_root(app)?;
    for d in [
        root.join("bin"),
        root.join("models"),
        root.join("tmp"),
        root.join("audio"),
    ] {
        std::fs::create_dir_all(&d).map_err(|e| e.to_string())?;
    }
    Ok(root)
}

/// Resolve local media path: if `p` is absolute and exists, use it; else join relative to app root.
pub fn resolve_local_media(app: &AppHandle, p: &str) -> PathBuf {
    let path = Path::new(p);
    if path.is_absolute() && path.exists() {
        return path.to_path_buf();
    }
    app_root(app).unwrap_or_else(|_| PathBuf::from(".")).join(p)
}

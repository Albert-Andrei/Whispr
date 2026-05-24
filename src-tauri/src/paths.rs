use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

pub fn app_root(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map_err(|e| e.to_string())
}

pub fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_root(app)?.join("whispr.db"))
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

/// Resolve a bundled sidecar binary. Tauri places sidecars alongside the main
/// executable (Contents/MacOS/ in a .app, or target/debug/ during `tauri dev`).
fn sidecar_path(name: &str) -> Result<PathBuf, String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let dir = exe.parent().ok_or("Cannot determine executable directory")?;
    Ok(dir.join(format!("{name}-aarch64-apple-darwin")))
}

pub fn ffmpeg_path(_app: &AppHandle) -> Result<PathBuf, String> {
    sidecar_path("ffmpeg")
}

pub fn ytdlp_path(_app: &AppHandle) -> Result<PathBuf, String> {
    sidecar_path("yt-dlp")
}

pub fn whisper_cli_path(_app: &AppHandle) -> Result<PathBuf, String> {
    sidecar_path("whisper-cli")
}

pub fn ensure_layout(app: &AppHandle) -> Result<PathBuf, String> {
    let root = app_root(app)?;
    for d in [root.join("models"), root.join("tmp"), root.join("audio")] {
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

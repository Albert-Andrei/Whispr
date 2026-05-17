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

pub fn bin_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_root(app)?.join("bin"))
}

pub fn models_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_root(app)?.join("models"))
}

pub fn tmp_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_root(app)?.join("tmp"))
}

pub fn ffmpeg_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(bin_dir(app)?.join(if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" }))
}

pub fn ytdlp_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(bin_dir(app)?.join(if cfg!(windows) { "yt-dlp.exe" } else { "yt-dlp" }))
}

pub fn whisper_cli_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(bin_dir(app)?.join(if cfg!(windows) { "whisper-cli.exe" } else { "whisper-cli" }))
}

pub fn ensure_layout(app: &AppHandle) -> Result<PathBuf, String> {
    let root = app_root(app)?;
    for d in [root.join("bin"), root.join("models"), root.join("tmp")] {
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

use crate::paths;
use std::path::PathBuf;
use tauri::AppHandle;

/// Where the compact M4A playback copy of a job's media lives (encoded by `extract_audio`).
pub fn playback_audio_path(app: &AppHandle, job_id: &str) -> Result<PathBuf, String> {
    Ok(paths::audio_dir(app)?.join(format!("{job_id}.m4a")))
}

pub fn remove_job_audio(app: &AppHandle, job_id: &str) {
    if let Ok(p) = playback_audio_path(app, job_id) {
        let _ = std::fs::remove_file(p);
    }
}

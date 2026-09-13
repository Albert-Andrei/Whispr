use crate::paths;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::AppHandle;

/// Encode a compact M4A copy of the source media for in-app playback.
pub fn persist_playback_audio(
    app: &AppHandle,
    job_id: &str,
    input: &Path,
) -> Result<PathBuf, String> {
    let ffmpeg = paths::ffmpeg_path(app)?;
    if !ffmpeg.is_file() {
        return Err("ffmpeg is not installed. Finish setup first.".into());
    }
    let audio_dir = paths::audio_dir(app)?;
    let out = audio_dir.join(format!("{job_id}.m4a"));

    let mut child = Command::new(&ffmpeg)
        .arg("-y")
        .arg("-i")
        .arg(input)
        .arg("-vn")
        .arg("-ac")
        .arg("1")
        .arg("-c:a")
        .arg("aac")
        .arg("-b:a")
        .arg("128k")
        .arg(&out)
        .spawn()
        .map_err(|e| format!("ffmpeg (persist audio) failed to start: {e}"))?;

    super::register_child(job_id, child.id());
    let status = child.wait().map_err(|e| format!("ffmpeg (persist audio) wait failed: {e}"))?;
    super::unregister_child(job_id);

    if super::is_cancelled(job_id) {
        let _ = std::fs::remove_file(&out);
        return Err("Cancelled".into());
    }
    if !status.success() {
        let _ = std::fs::remove_file(&out);
        return Err("ffmpeg failed to create playback audio".into());
    }
    Ok(out)
}

pub fn remove_job_audio(app: &AppHandle, job_id: &str) {
    if let Ok(dir) = paths::audio_dir(app) {
        let p = dir.join(format!("{job_id}.m4a"));
        let _ = std::fs::remove_file(p);
    }
}

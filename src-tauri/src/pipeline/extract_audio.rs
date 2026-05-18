use crate::paths;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::AppHandle;

pub fn extract_wav_16k_mono(
    app: &AppHandle,
    job_id: &str,
    input: &Path,
) -> Result<PathBuf, String> {
    paths::ensure_layout(app)?;
    let ffmpeg = paths::ffmpeg_path(app)?;
    if !ffmpeg.is_file() {
        return Err("ffmpeg is not installed. Finish setup first.".into());
    }
    let tmp = paths::tmp_dir(app)?;
    let out = tmp.join(format!("{job_id}.wav"));

    let mut child = Command::new(&ffmpeg)
        .arg("-y")
        .arg("-i")
        .arg(input)
        .arg("-ar")
        .arg("16000")
        .arg("-ac")
        .arg("1")
        .arg("-c:a")
        .arg("pcm_s16le")
        .arg(&out)
        .spawn()
        .map_err(|e| format!("ffmpeg failed to start: {e}"))?;

    super::register_child(job_id, child.id());
    let status = child.wait().map_err(|e| format!("ffmpeg wait failed: {e}"))?;
    super::unregister_child(job_id);

    if super::is_cancelled(job_id) {
        return Err("Cancelled".into());
    }
    if !status.success() {
        return Err("ffmpeg exited with an error".into());
    }
    Ok(out)
}

use crate::jobs_db;
use crate::paths;
use std::fs;
use std::path::Path;
use std::process::{Command, Stdio};
use tauri::AppHandle;

pub fn transcribe_chunk(app: &AppHandle, wav_path: &Path) -> Result<String, String> {
    let cli = paths::whisper_cli_path(app)?;
    if !cli.exists() {
        return Err("whisper-cli is not available".into());
    }

    let model_path = jobs_db::model_path(app)?;
    let tmp = paths::tmp_dir(app)?;
    let prefix = wav_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("chunk");
    let out_str = tmp.join(format!("{prefix}-out"));
    let out_display = out_str.to_str().ok_or("Invalid temp path")?;

    let _ = fs::remove_file(format!("{out_display}.txt"));
    let _ = fs::remove_file(format!("{out_display}.srt"));

    let status = Command::new(&cli)
        .arg("-m")
        .arg(&model_path)
        .arg("-f")
        .arg(wav_path)
        .arg("-l")
        .arg("auto")
        .arg("-of")
        .arg(out_display)
        .arg("-otxt")
        .stderr(Stdio::null())
        .stdout(Stdio::null())
        .status()
        .map_err(|e| format!("whisper-cli failed: {e}"))?;

    if !status.success() {
        return Err("whisper-cli exited with an error".into());
    }

    let txt_path = format!("{out_display}.txt");
    let transcript = fs::read_to_string(&txt_path).unwrap_or_default();
    let _ = fs::remove_file(&txt_path);
    let _ = fs::remove_file(format!("{out_display}.srt"));

    Ok(transcript.trim().to_string())
}

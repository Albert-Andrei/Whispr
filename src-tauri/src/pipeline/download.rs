use crate::paths;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::AppHandle;

pub fn download_url_to_tmp(
    app: &AppHandle,
    job_id: &str,
    url: &str,
) -> Result<PathBuf, String> {
    paths::ensure_layout(app)?;
    let ytdlp = paths::ytdlp_path(app)?;
    if !ytdlp.is_file() {
        return Err("yt-dlp is not installed. Finish setup first.".into());
    }
    let tmp = paths::tmp_dir(app)?;
    let template = tmp.join(format!("{job_id}.%(ext)s"));
    let tpl = template.to_str().ok_or("Bad tmp path")?;

    let status = Command::new(&ytdlp)
        .current_dir(&tmp)
        .arg("-f")
        .arg("bestaudio/best")
        .arg("--no-playlist")
        .arg("-o")
        .arg(tpl)
        .arg(url)
        .status()
        .map_err(|e| format!("yt-dlp failed to start: {e}"))?;

    if !status.success() {
        return Err("yt-dlp exited with an error".into());
    }

    find_downloaded_file(&tmp, job_id)
}

fn find_downloaded_file(tmp: &Path, job_id: &str) -> Result<PathBuf, String> {
    let mut found: Vec<PathBuf> = Vec::new();
    let read = std::fs::read_dir(tmp).map_err(|e| e.to_string())?;
    for e in read.flatten() {
        let p = e.path();
        let name = e.file_name().to_string_lossy().into_owned();
        if name.starts_with(job_id) && p.is_file() {
            let ext = p
                .extension()
                .and_then(|x| x.to_str())
                .unwrap_or("")
                .to_lowercase();
            if ext == "part" || ext == "ytdl" {
                continue;
            }
            if ext != "wav" {
                found.push(p);
            }
        }
    }
    found.sort();
    found
        .into_iter()
        .next()
        .ok_or_else(|| "Could not find downloaded media file".into())
}

pub fn resolve_media_path(app: &AppHandle, source_path: &str) -> PathBuf {
    paths::resolve_local_media(app, source_path)
}

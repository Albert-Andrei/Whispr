use crate::paths;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::AppHandle;

pub fn download_url_to_tmp(
    app: &AppHandle,
    job_id: &str,
    url: &str,
    on_progress: &dyn Fn(f64),
) -> Result<PathBuf, String> {
    paths::ensure_layout(app)?;
    let ytdlp = paths::ytdlp_path(app)?;
    if !ytdlp.is_file() {
        return Err("yt-dlp is not installed. Finish setup first.".into());
    }
    let tmp = paths::tmp_dir(app)?;
    let template = tmp.join(format!("{job_id}.%(ext)s"));
    let tpl = template.to_str().ok_or("Bad tmp path")?;

    let mut child = Command::new(&ytdlp)
        .current_dir(&tmp)
        .arg("-f")
        .arg("bestaudio/best")
        .arg("--no-playlist")
        .arg("--newline")
        .arg("-o")
        .arg(tpl)
        .arg(url)
        .stdout(Stdio::piped())
        .spawn()
        .map_err(|e| format!("yt-dlp failed to start: {e}"))?;

    super::register_child(job_id, child.id());

    // Progress lines go to stdout with --newline (no --print flag)
    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        for line in reader.lines().map_while(Result::ok) {
            if let Some(pct) = parse_ytdlp_progress(&line) {
                on_progress(pct);
            }
        }
    }

    let status = child.wait().map_err(|e| format!("yt-dlp wait failed: {e}"))?;
    super::unregister_child(job_id);

    if super::is_cancelled(job_id) {
        return Err("Cancelled".into());
    }
    if !status.success() {
        return Err("yt-dlp exited with an error".into());
    }

    find_downloaded_file(&tmp, job_id)
}

fn parse_ytdlp_progress(line: &str) -> Option<f64> {
    // Lines look like: "[download]  45.2% of 5.23MiB at 2.34MiB/s ETA 00:01"
    let line = line.trim();
    if !line.starts_with("[download]") {
        return None;
    }
    let rest = line.strip_prefix("[download]")?.trim();
    let pct_str = rest.split('%').next()?.trim();
    pct_str.parse::<f64>().ok().map(|v| v / 100.0)
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

/// Fast title fetch: YouTube oEmbed (HTTP, no spawn) with yt-dlp fallback.
pub fn fetch_url_title(app: &AppHandle, url: &str) -> Option<String> {
    if let Some(title) = fetch_title_oembed(url) {
        return Some(title);
    }
    fetch_title_ytdlp(app, url)
}

fn fetch_title_oembed(url: &str) -> Option<String> {
    let lower = url.to_lowercase();
    let is_youtube = lower.contains("youtube.com/") || lower.contains("youtu.be/");
    if !is_youtube {
        return None;
    }
    let oembed_url = format!(
        "https://www.youtube.com/oembed?url={}&format=json",
        urlencoding::encode(url)
    );
    let resp = reqwest::blocking::get(&oembed_url).ok()?;
    if !resp.status().is_success() {
        return None;
    }
    let json: serde_json::Value = resp.json().ok()?;
    json.get("title")?.as_str().map(|s| s.to_string())
}

fn fetch_title_ytdlp(app: &AppHandle, url: &str) -> Option<String> {
    let ytdlp = paths::ytdlp_path(app).ok()?;
    if !ytdlp.is_file() {
        return None;
    }
    let output = Command::new(&ytdlp)
        .arg("--print")
        .arg("title")
        .arg("--no-download")
        .arg("--no-playlist")
        .arg(url)
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let title = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if title.is_empty() {
        None
    } else {
        Some(title)
    }
}

pub fn resolve_media_path(app: &AppHandle, source_path: &str) -> PathBuf {
    paths::resolve_local_media(app, source_path)
}

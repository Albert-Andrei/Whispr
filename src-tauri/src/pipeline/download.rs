use super::extract_audio::{parse_time_field, split_cr_lf};
use crate::paths;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::thread;
use tauri::AppHandle;

/// One yt-dlp progress update.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DownloadProgress {
    /// 0..1 of the file downloaded.
    pub fraction: f64,
    /// yt-dlp's own estimate of seconds left in the download.
    pub eta_secs: Option<f64>,
    /// Length of the media itself, in seconds.
    pub media_secs: Option<f64>,
}

/// Machine-readable progress line: downloaded, total, total estimate, eta, media duration.
const PROGRESS_TEMPLATE: &str = "download:WHISPR %(progress.downloaded_bytes)s %(progress.total_bytes)s %(progress.total_bytes_estimate)s %(progress.eta)s %(info.duration)s";

/// Downloads the audio of `url` into tmp/. With `section` (start, end seconds)
/// only that part is fetched; yt-dlp hands the cut to ffmpeg, whose `time=`
/// output is then the progress signal.
pub fn download_url_to_tmp(
    app: &AppHandle,
    job_id: &str,
    url: &str,
    section: Option<(f64, f64)>,
    on_progress: &dyn Fn(DownloadProgress),
) -> Result<PathBuf, String> {
    paths::ensure_layout(app)?;
    let ytdlp = paths::ytdlp_path(app)?;
    if !ytdlp.is_file() {
        return Err("yt-dlp is not available. The bundled binary may be missing — try reinstalling Whispr.".into());
    }
    let tmp = paths::tmp_dir(app)?;
    let template = tmp.join(format!("{job_id}.%(ext)s"));
    let tpl = template.to_str().ok_or("Bad tmp path")?;

    let mut cmd = Command::new(&ytdlp);
    super::own_process_group(&mut cmd);
    cmd.current_dir(&tmp)
        .args(["-f", "bestaudio/best", "--no-playlist", "--newline"])
        .arg("--progress-template")
        .arg(PROGRESS_TEMPLATE);
    if let Some((start, end)) = section {
        let ffmpeg = paths::ffmpeg_path(app)?;
        cmd.arg("--ffmpeg-location")
            .arg(ffmpeg)
            .arg("--download-sections")
            .arg(format!("*{start:.3}-{end:.3}"))
            // Cut exactly where the user asked, not at the nearest keyframe.
            .arg("--force-keyframes-at-cuts");
    }
    let mut child = cmd
        .arg("-o")
        .arg(tpl)
        .arg(url)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("yt-dlp failed to start: {e}"))?;

    super::register_child(job_id, child.id());

    let (tx, rx) = mpsc::channel::<DownloadProgress>();
    // stdout: our progress template, one line per update thanks to --newline.
    let stdout_reader = child.stdout.take().map(|stdout| {
        let tx = tx.clone();
        thread::spawn(move || {
            for line in BufReader::new(stdout).lines().map_while(Result::ok) {
                if let Some(p) = parse_ytdlp_progress(&line) {
                    let _ = tx.send(p);
                }
            }
        })
    });
    // stderr: ffmpeg's `time=` while cutting a section, and yt-dlp's error text.
    let section_len = section.map(|(s, e)| (e - s).max(0.001));
    let stderr_reader = child.stderr.take().map(|stderr| {
        let tx = tx.clone();
        thread::spawn(move || {
            let mut last_error = None;
            for line in split_cr_lf(BufReader::new(stderr)) {
                if let (Some(len), Some(done)) = (section_len, parse_time_field(&line)) {
                    let _ = tx.send(DownloadProgress {
                        fraction: (done / len).clamp(0.0, 1.0),
                        eta_secs: None,
                        media_secs: Some(len),
                    });
                }
                if let Some(msg) = line.trim().strip_prefix("ERROR: ") {
                    last_error = Some(msg.to_string());
                }
            }
            last_error
        })
    });
    drop(tx);

    for p in rx {
        on_progress(p);
    }
    if let Some(h) = stdout_reader {
        let _ = h.join();
    }
    let last_error = stderr_reader.and_then(|h| h.join().ok()).flatten();

    let status = child.wait().map_err(|e| format!("yt-dlp wait failed: {e}"))?;
    super::unregister_child(job_id);

    if super::is_cancelled(job_id) {
        return Err("Cancelled".into());
    }
    if !status.success() {
        return Err(match last_error {
            Some(msg) => format!("yt-dlp: {msg}"),
            None => "yt-dlp exited with an error".into(),
        });
    }

    find_downloaded_file(&tmp, job_id)
}

fn parse_ytdlp_progress(line: &str) -> Option<DownloadProgress> {
    // "WHISPR <downloaded> <total> <total_estimate> <eta> <duration>", "NA" when unknown.
    let mut fields = line.trim().strip_prefix("WHISPR ")?.split_whitespace();
    let num = |f: Option<&str>| f.and_then(|v| v.parse::<f64>().ok());
    let downloaded = num(fields.next())?;
    let total = num(fields.next());
    let estimate = num(fields.next());
    let eta_secs = num(fields.next());
    let media_secs = num(fields.next()).filter(|d| *d > 0.0);
    let size = total.or(estimate).filter(|t| *t > 0.0)?;
    Some(DownloadProgress {
        fraction: (downloaded / size).clamp(0.0, 1.0),
        eta_secs,
        media_secs,
    })
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_progress_template() {
        assert_eq!(
            parse_ytdlp_progress("WHISPR 1024 4096 NA 12 600"),
            Some(DownloadProgress { fraction: 0.25, eta_secs: Some(12.0), media_secs: Some(600.0) })
        );
        assert_eq!(
            parse_ytdlp_progress("WHISPR 50 NA 200 NA NA"),
            Some(DownloadProgress { fraction: 0.25, eta_secs: None, media_secs: None })
        );
        assert_eq!(parse_ytdlp_progress("WHISPR 50 NA NA NA NA"), None);
        assert_eq!(parse_ytdlp_progress("[download] Destination: x.webm"), None);
    }
}

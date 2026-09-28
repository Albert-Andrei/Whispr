//! Lightweight media inspection used by the import clip editor, before a job exists.

use crate::paths;
use serde::Serialize;
use std::process::Command;
use tauri::{AppHandle, Manager};

/// Preview streams: prefer a small H.264 MP4 video with a separate M4A audio
/// track (what YouTube serves), else any single file WebKit is likely to play.
const PREVIEW_FORMAT: &str = "bv*[height<=480][vcodec^=avc1][ext=mp4]+ba[ext=m4a]/b[height<=480][ext=mp4]/bv*[height<=480][ext=mp4]+ba/b[height<=480]/b/ba";

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UrlProbe {
    pub title: Option<String>,
    pub duration_secs: Option<f64>,
    pub thumbnail: Option<String>,
    /// Stream with picture (may also carry sound when `audio_url` is None).
    pub video_url: Option<String>,
    /// Separate sound stream to play in sync with `video_url`, or the only stream.
    pub audio_url: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalProbe {
    pub duration_secs: Option<f64>,
    pub has_video: bool,
}

#[tauri::command]
pub async fn probe_url(app: AppHandle, url: String) -> Result<UrlProbe, String> {
    tokio::task::spawn_blocking(move || probe_url_blocking(&app, &url))
        .await
        .map_err(|e| e.to_string())?
}

fn probe_url_blocking(app: &AppHandle, url: &str) -> Result<UrlProbe, String> {
    let ytdlp = paths::ytdlp_path(app)?;
    if !ytdlp.is_file() {
        return Err("yt-dlp is not available. The bundled binary may be missing — try reinstalling Whispr.".into());
    }
    let mut cmd = Command::new(&ytdlp);
    if let Ok(ffmpeg) = paths::ffmpeg_path(app) {
        // yt-dlp only picks split video+audio formats when it can find ffmpeg.
        cmd.arg("--ffmpeg-location").arg(ffmpeg);
    }
    let output = cmd
        .args(["-J", "--no-playlist", "--no-warnings", "-f", PREVIEW_FORMAT])
        .arg(url)
        .output()
        .map_err(|e| format!("yt-dlp failed to start: {e}"))?;
    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        let line = err.lines().rev().find(|l| !l.trim().is_empty()).unwrap_or("");
        return Err(if line.is_empty() {
            "Could not read this link".into()
        } else {
            line.trim_start_matches("ERROR: ").to_string()
        });
    }
    let json: serde_json::Value =
        serde_json::from_slice(&output.stdout).map_err(|e| format!("Unexpected yt-dlp output: {e}"))?;
    Ok(parse_probe_json(&json))
}

fn parse_probe_json(json: &serde_json::Value) -> UrlProbe {
    let text = |v: &serde_json::Value, key: &str| v.get(key).and_then(|x| x.as_str()).map(str::to_string);
    let has = |v: &serde_json::Value, key: &str| {
        v.get(key).and_then(|x| x.as_str()).map_or(false, |c| c != "none")
    };

    let mut probe = UrlProbe {
        title: text(json, "title"),
        duration_secs: json.get("duration").and_then(|d| d.as_f64()).filter(|d| *d > 0.0),
        thumbnail: text(json, "thumbnail"),
        ..Default::default()
    };

    // WebKit plays HLS natively, with picture and sound muxed per variant. It is
    // also the only YouTube preview it can open: the split DASH MP4s never load.
    let hls_manifest = json
        .get("formats")
        .and_then(|f| f.as_array())
        .and_then(|formats| {
            formats.iter().find_map(|f| {
                let is_hls = f.get("protocol").and_then(|p| p.as_str()).map_or(false, |p| p.starts_with("m3u8"));
                if is_hls { text(f, "manifest_url") } else { None }
            })
        });

    if let Some(manifest) = hls_manifest {
        probe.video_url = Some(manifest);
    } else if let Some(formats) = json.get("requested_formats").and_then(|f| f.as_array()) {
        for f in formats {
            if has(f, "vcodec") && probe.video_url.is_none() {
                probe.video_url = text(f, "url");
            } else if has(f, "acodec") && probe.audio_url.is_none() {
                probe.audio_url = text(f, "url");
            }
        }
    } else if let Some(u) = text(json, "url") {
        if has(json, "vcodec") {
            probe.video_url = Some(u);
        } else {
            probe.audio_url = Some(u);
        }
    }
    probe
}

#[tauri::command]
pub async fn probe_local_media(app: AppHandle, path: String) -> Result<LocalProbe, String> {
    // Let the preview player read this one file through the asset protocol.
    let _ = app.asset_protocol_scope().allow_file(&path);
    tokio::task::spawn_blocking(move || {
        let ffmpeg = paths::ffmpeg_path(&app)?;
        let output = Command::new(&ffmpeg)
            .args(["-hide_banner", "-nostdin", "-i"])
            .arg(&path)
            .output()
            .map_err(|e| format!("ffmpeg failed to start: {e}"))?;
        // With no output file ffmpeg exits with an error, but it has printed the stream info.
        Ok(parse_ffmpeg_info(&String::from_utf8_lossy(&output.stderr)))
    })
    .await
    .map_err(|e| e.to_string())?
}

fn parse_ffmpeg_info(stderr: &str) -> LocalProbe {
    let duration_secs = stderr
        .lines()
        .find_map(|l| super::extract_audio::parse_duration_line(l))
        .filter(|d| *d > 0.0);
    let has_video = stderr
        .lines()
        .any(|l| l.contains("Stream #") && l.contains("Video:") && !l.contains("attached pic"));
    LocalProbe { duration_secs, has_video }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prefers_hls_manifest() {
        let json = serde_json::json!({
            "formats": [
                {"protocol": "https", "url": "dash"},
                {"protocol": "m3u8_native", "url": "variant", "manifest_url": "master"}
            ],
            "requested_formats": [{"url": "v", "vcodec": "avc1", "acodec": "none"}]
        });
        let p = parse_probe_json(&json);
        assert_eq!((p.video_url.as_deref(), p.audio_url), (Some("master"), None));
    }

    #[test]
    fn parses_split_and_single_formats() {
        let split = serde_json::json!({
            "title": "T", "duration": 634.6, "thumbnail": "th",
            "requested_formats": [
                {"url": "v", "vcodec": "avc1", "acodec": "none"},
                {"url": "a", "vcodec": "none", "acodec": "mp4a"}
            ]
        });
        let p = parse_probe_json(&split);
        assert_eq!((p.video_url.as_deref(), p.audio_url.as_deref()), (Some("v"), Some("a")));
        assert_eq!(p.duration_secs, Some(634.6));

        let audio_only = serde_json::json!({"url": "a", "vcodec": "none", "acodec": "opus"});
        let p = parse_probe_json(&audio_only);
        assert_eq!((p.video_url, p.audio_url.as_deref()), (None, Some("a")));
    }

    #[test]
    fn parses_local_info() {
        let info = "Input #0, mp3, from 'x.mp3':\n  Duration: 00:47:25.12, start: 0.025057, bitrate: 128 kb/s\n  Stream #0:0: Audio: mp3\n  Stream #0:1: Video: mjpeg (attached pic)\n";
        let p = parse_ffmpeg_info(info);
        assert_eq!(p.duration_secs, Some(2845.12));
        assert!(!p.has_video);
    }
}

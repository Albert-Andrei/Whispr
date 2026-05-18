use crate::jobs_db;
use crate::paths;
use serde::Serialize;
use std::io::Read;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BinaryInfo {
    pub id: String,
    pub label: String,
    pub ok: bool,
    pub version: Option<String>,
    pub path: Option<String>,
    pub size_bytes: Option<u64>,
    pub role: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BinaryHealthReport {
    pub ffmpeg: BinaryInfo,
    pub ytdlp: BinaryInfo,
    pub whisper: BinaryInfo,
}

/// Best-effort `--version` style probe: no stdin, bounded wait so Settings never hangs the app.
fn run_version(bin: &Path, arg: &str) -> Option<String> {
    let mut child = Command::new(bin)
        .arg(arg)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .ok()?;

    let mut stdout = child.stdout.take()?;
    let deadline = Instant::now() + Duration::from_secs(3);

    loop {
        match child.try_wait().ok()? {
            Some(status) => {
                let mut buf = String::new();
                stdout.read_to_string(&mut buf).ok()?;
                if !status.success() {
                    return None;
                }
                return buf.lines().next().map(|l| l.trim().to_string());
            }
            None => {
                if Instant::now() > deadline {
                    let _ = child.kill();
                    let _ = child.wait();
                    return None;
                }
                std::thread::sleep(Duration::from_millis(20));
            }
        }
    }
}

#[tauri::command]
pub async fn check_binaries(app: AppHandle) -> Result<BinaryHealthReport, String> {
    paths::ensure_layout(&app)?;
    let ffmpeg = paths::ffmpeg_path(&app)?;
    let ytdlp = paths::ytdlp_path(&app)?;
    let whisper_cli = paths::whisper_cli_path(&app)?;

    tokio::task::spawn_blocking(move || {
        let ffmpeg_ok = ffmpeg.is_file();
        let ffmpeg_ver = ffmpeg_ok.then(|| run_version(&ffmpeg, "-version")).flatten();
        let ffmpeg_size = ffmpeg_ok.then(|| jobs_db::file_size64(&ffmpeg));

        let ytdlp_ok = ytdlp.is_file();
        let ytdlp_ver = ytdlp_ok.then(|| run_version(&ytdlp, "--version")).flatten();
        let ytdlp_size = ytdlp_ok.then(|| jobs_db::file_size64(&ytdlp));

        let whisper_ok = whisper_cli.exists();
        let whisper_ver = whisper_ok.then(|| run_version(&whisper_cli, "--version")).flatten();
        let whisper_size = whisper_ok.then(|| jobs_db::file_size64(&whisper_cli));

        BinaryHealthReport {
            ffmpeg: BinaryInfo {
                id: "ffmpeg".into(),
                label: "ffmpeg".into(),
                ok: ffmpeg_ok,
                version: ffmpeg_ver,
                path: Some(ffmpeg.to_string_lossy().into()),
                size_bytes: ffmpeg_size,
                role: "Audio/video processing".into(),
            },
            ytdlp: BinaryInfo {
                id: "yt-dlp".into(),
                label: "yt-dlp".into(),
                ok: ytdlp_ok,
                version: ytdlp_ver,
                path: Some(ytdlp.to_string_lossy().into()),
                size_bytes: ytdlp_size,
                role: "URL media download".into(),
            },
            whisper: BinaryInfo {
                id: "whisper-cli".into(),
                label: "whisper-cli".into(),
                ok: whisper_ok,
                version: whisper_ver,
                path: Some(whisper_cli.to_string_lossy().into()),
                size_bytes: whisper_size,
                role: "Local transcription (whisper.cpp CLI; installed via Homebrew by Whispr when needed)".into(),
            },
        }
    }).await.map_err(|e| e.to_string())
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskCategory {
    pub id: String,
    pub label: String,
    pub bytes: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskUsageReport {
    pub categories: Vec<DiskCategory>,
    pub total_bytes: u64,
}

#[tauri::command]
pub async fn get_app_disk_usage(app: AppHandle) -> Result<DiskUsageReport, String> {
    paths::ensure_layout(&app)?;
    let bin = paths::bin_dir(&app)?;
    let models = paths::models_dir(&app)?;
    let tmp = paths::tmp_dir(&app)?;
    let db = paths::db_path(&app)?;

    tokio::task::spawn_blocking(move || {
        let bin_bytes = jobs_db::dir_size(&bin);
        let models_bytes = jobs_db::dir_size(&models);
        let tmp_bytes = jobs_db::dir_size(&tmp);
        let db_bytes = jobs_db::file_size64(&db);

        let mut categories = vec![
            DiskCategory {
                id: "binaries".into(),
                label: "Tools (ffmpeg, yt-dlp)".into(),
                bytes: bin_bytes,
            },
            DiskCategory {
                id: "models".into(),
                label: "Whisper models".into(),
                bytes: models_bytes,
            },
            DiskCategory {
                id: "database".into(),
                label: "Database".into(),
                bytes: db_bytes,
            },
            DiskCategory {
                id: "temp".into(),
                label: "Temporary files".into(),
                bytes: tmp_bytes,
            },
        ];

        let mut total: u64 = categories.iter().map(|c| c.bytes).sum();

        if let Ok(exe) = std::env::current_exe() {
            let exe_sz = jobs_db::file_size64(&exe);
            if exe_sz > 0 {
                categories.push(DiskCategory {
                    id: "app_core".into(),
                    label: "App executable".into(),
                    bytes: exe_sz,
                });
                total += exe_sz;
            }
        }

        DiskUsageReport {
            categories,
            total_bytes: total,
        }
    }).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_recommended_max_concurrent() -> u32 {
    let cores = std::thread::available_parallelism()
        .map(|n| n.get() as u32)
        .unwrap_or(4);
    (cores / 4).max(1).min(3)
}

#[tauri::command]
pub fn delete_model_file(app: AppHandle, filename: String) -> Result<(), String> {
    let p = paths::models_dir(&app)?.join(&filename);
    if p.exists() {
        std::fs::remove_file(&p).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn list_model_files(app: AppHandle) -> Result<Vec<String>, String> {
    let d = paths::models_dir(&app)?;
    tokio::task::spawn_blocking(move || {
        let mut names: Vec<String> = Vec::new();
        for e in std::fs::read_dir(&d).map_err(|e| e.to_string())? {
            let e = e.map_err(|e| e.to_string())?;
            let n = e.file_name().to_string_lossy().into_owned();
            if n.ends_with(".bin") {
                names.push(n);
            }
        }
        names.sort();
        Ok(names)
    }).await.map_err(|e| e.to_string())?
}

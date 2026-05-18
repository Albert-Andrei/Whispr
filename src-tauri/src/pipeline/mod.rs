mod download;
mod extract_audio;
pub mod progress;
mod transcribe;

use crate::jobs_db;
use crate::paths;
use progress::PipelineProgress;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::process::Command;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

static ACTIVE_PIDS: Mutex<Option<HashMap<String, u32>>> = Mutex::new(None);
static CANCELLED: Mutex<Option<HashSet<String>>> = Mutex::new(None);

fn pids_map() -> &'static Mutex<Option<HashMap<String, u32>>> {
    &ACTIVE_PIDS
}

fn cancelled_set() -> &'static Mutex<Option<HashSet<String>>> {
    &CANCELLED
}

pub fn register_child(job_id: &str, pid: u32) {
    let mut lock = pids_map().lock().unwrap();
    lock.get_or_insert_with(HashMap::new).insert(job_id.to_string(), pid);
}

pub fn unregister_child(job_id: &str) {
    let mut lock = pids_map().lock().unwrap();
    if let Some(map) = lock.as_mut() {
        map.remove(job_id);
    }
}

pub fn is_cancelled(job_id: &str) -> bool {
    let lock = cancelled_set().lock().unwrap();
    lock.as_ref().map_or(false, |s| s.contains(job_id))
}

fn mark_cancelled(job_id: &str) {
    let mut lock = cancelled_set().lock().unwrap();
    lock.get_or_insert_with(HashSet::new).insert(job_id.to_string());
}

fn clear_cancelled(job_id: &str) {
    let mut lock = cancelled_set().lock().unwrap();
    if let Some(s) = lock.as_mut() {
        s.remove(job_id);
    }
}

fn kill_active_child(job_id: &str) {
    let pid = {
        let lock = pids_map().lock().unwrap();
        lock.as_ref().and_then(|m| m.get(job_id).copied())
    };
    if let Some(pid) = pid {
        let _ = Command::new("kill")
            .arg("-TERM")
            .arg(pid.to_string())
            .status();
        unregister_child(job_id);
    }
}

fn cleanup_job_tmp(app: &AppHandle, job_id: &str) {
    if let Ok(tmp) = paths::tmp_dir(app) {
        if let Ok(read) = fs::read_dir(&tmp) {
            for e in read.flatten() {
                if e.file_name().to_string_lossy().starts_with(job_id) {
                    let _ = fs::remove_file(e.path());
                }
            }
        }
    }
}

fn check_cancelled(job_id: &str) -> Result<(), String> {
    if is_cancelled(job_id) {
        Err("Cancelled".into())
    } else {
        Ok(())
    }
}

pub fn run_pipeline_blocking(
    app: AppHandle,
    job_id: String,
    source_type: String,
    source_path: Option<String>,
    source_url: Option<String>,
) -> Result<(), String> {
    paths::ensure_layout(&app)?;
    jobs_db::set_job_processing(&app, &job_id)?;

    let emit = |stage: &str, pct: f64| {
        let _ = app.emit(
            "pipeline:progress",
            PipelineProgress {
                job_id: job_id.clone(),
                stage: stage.to_string(),
                percent: pct,
            },
        );
        let _ = jobs_db::set_job_progress(&app, &job_id, pct, Some(stage));
    };

    let model_path = jobs_db::model_path(&app);
    let model_name = jobs_db::selected_model_filename(&app);

    let inner = (|| -> Result<(), String> {
        let model_path = model_path?;
        let model_used = model_name?;

        let media_path = if source_type == "url" {
            let url = source_url.ok_or_else(|| "Missing URL".to_string())?;
            emit("downloading", 0.02);
            let p = download::download_url_to_tmp(&app, &job_id, &url, &|pct| {
                let overall = 0.02 + pct * 0.20;
                let _ = app.emit(
                    "pipeline:progress",
                    PipelineProgress {
                        job_id: job_id.clone(),
                        stage: "downloading".to_string(),
                        percent: overall,
                    },
                );
                let _ = jobs_db::set_job_progress(&app, &job_id, overall, Some("downloading"));
            })?;
            check_cancelled(&job_id)?;
            emit("downloading", 0.22);
            p
        } else {
            let sp = source_path.ok_or_else(|| "Missing file path".to_string())?;
            let p = download::resolve_media_path(&app, &sp);
            if !p.is_file() {
                return Err(format!("File not found: {}", p.display()));
            }
            emit("downloading", 0.22);
            p
        };

        check_cancelled(&job_id)?;
        emit("extracting", 0.25);
        let wav = extract_audio::extract_wav_16k_mono(&app, &job_id, &media_path)?;
        emit("extracting", 0.45);

        check_cancelled(&job_id)?;
        let (text, srt, dur) =
            transcribe::transcribe_file(&app, &job_id, &wav, &model_path, 0.45, 0.55)?;

        check_cancelled(&job_id)?;
        jobs_db::set_job_completed(
            &app,
            &job_id,
            &text,
            if srt.trim().is_empty() {
                None
            } else {
                Some(srt.as_str())
            },
            &model_used,
            dur.as_deref(),
        )?;
        emit("transcribing", 1.0);
        Ok(())
    })();

    cleanup_job_tmp(&app, &job_id);
    clear_cancelled(&job_id);
    unregister_child(&job_id);

    match inner {
        Ok(()) => Ok(()),
        Err(e) if e == "Cancelled" => Ok(()),
        Err(e) => {
            let _ = jobs_db::set_job_failed(&app, &job_id, &e);
            Err(e)
        }
    }
}

#[tauri::command]
pub async fn run_pipeline(
    app: AppHandle,
    job_id: String,
    source_type: String,
    source_path: Option<String>,
    source_url: Option<String>,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        run_pipeline_blocking(app, job_id, source_type, source_path, source_url)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn fetch_url_title(app: AppHandle, url: String, job_id: String) -> Result<Option<String>, String> {
    tokio::task::spawn_blocking(move || {
        let title = download::fetch_url_title(&app, &url);
        if let Some(ref t) = title {
            let _ = jobs_db::set_job_filename(&app, &job_id, t);
        }
        Ok(title)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn cancel_pipeline(app: AppHandle, job_id: String) -> Result<(), String> {
    mark_cancelled(&job_id);
    kill_active_child(&job_id);
    cleanup_job_tmp(&app, &job_id);
    Ok(())
}

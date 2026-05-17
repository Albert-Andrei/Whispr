mod download;
mod extract_audio;
pub mod progress;
mod transcribe;

use crate::jobs_db;
use crate::paths;
use progress::PipelineProgress;
use std::fs;
use tauri::{AppHandle, Emitter};

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
            let p = download::download_url_to_tmp(&app, &job_id, &url)?;
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

        emit("extracting", 0.25);
        let wav = extract_audio::extract_wav_16k_mono(&app, &job_id, &media_path)?;
        emit("extracting", 0.45);

        let (text, srt, dur) =
            transcribe::transcribe_file(&app, &job_id, &wav, &model_path, 0.45, 0.55)?;

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

    match inner {
        Ok(()) => Ok(()),
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

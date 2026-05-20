use crate::paths;
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use std::path::Path;
use tauri::AppHandle;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct JobRow {
    pub id: String,
    pub filename: String,
    pub source_type: String,
    pub source_path: Option<String>,
    pub source_url: Option<String>,
    pub file_size: Option<i64>,
    pub duration: Option<String>,
    pub status: String,
    pub transcript: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub error_message: Option<String>,
    pub progress: f64,
    pub pipeline_stage: Option<String>,
    pub srt_output: Option<String>,
    pub model_used: Option<String>,
    pub audio_path: Option<String>,
    pub translated_text: Option<String>,
    pub translated_lang: Option<String>,
}

pub fn open_conn(app: &AppHandle) -> Result<Connection, String> {
    let dbp = paths::db_path(app)?;
    Connection::open(dbp).map_err(|e| e.to_string())
}

pub fn set_job_processing(app: &AppHandle, id: &str) -> Result<(), String> {
    let conn = open_conn(app)?;
    conn.execute(
        "UPDATE transcription_jobs SET status = 'processing', progress = 0, pipeline_stage = NULL, error_message = NULL, updated_at = ?1 WHERE id = ?2",
        params![chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true), id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn set_job_progress(
    app: &AppHandle,
    id: &str,
    progress: f64,
    stage: Option<&str>,
) -> Result<(), String> {
    let conn = open_conn(app)?;
    conn.execute(
        "UPDATE transcription_jobs SET progress = ?1, pipeline_stage = ?2, updated_at = ?3 WHERE id = ?4",
        params![
            progress,
            stage,
            chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn set_job_completed(
    app: &AppHandle,
    id: &str,
    transcript: &str,
    srt: Option<&str>,
    model_used: &str,
    duration_label: Option<&str>,
    audio_path: Option<&str>,
) -> Result<(), String> {
    let conn = open_conn(app)?;
    conn.execute(
        "UPDATE transcription_jobs SET transcript = ?1, srt_output = ?2, model_used = ?3, duration = COALESCE(?4, duration), audio_path = ?5, status = 'completed', progress = 1, pipeline_stage = NULL, error_message = NULL, translated_text = NULL, translated_lang = NULL, updated_at = ?6 WHERE id = ?7",
        params![
            transcript,
            srt,
            model_used,
            duration_label,
            audio_path,
            chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn set_job_filename(app: &AppHandle, id: &str, filename: &str) -> Result<(), String> {
    let conn = open_conn(app)?;
    conn.execute(
        "UPDATE transcription_jobs SET filename = ?1, updated_at = ?2 WHERE id = ?3",
        params![
            filename,
            chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn set_job_failed(app: &AppHandle, id: &str, err: &str) -> Result<(), String> {
    let conn = open_conn(app)?;
    conn.execute(
        "UPDATE transcription_jobs SET status = 'failed', error_message = ?1, updated_at = ?2 WHERE id = ?3",
        params![
            err,
            chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_job(app: &AppHandle, id: &str) -> Result<Option<JobRow>, String> {
    let conn = open_conn(app)?;
    let mut stmt = conn
        .prepare("SELECT id, filename, source_type, source_path, source_url, file_size, duration, status, transcript, created_at, updated_at, error_message, progress, pipeline_stage, srt_output, model_used, audio_path, translated_text, translated_lang FROM transcription_jobs WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query_map(params![id], |row| {
            Ok(JobRow {
                id: row.get(0)?,
                filename: row.get(1)?,
                source_type: row.get(2)?,
                source_path: row.get(3)?,
                source_url: row.get(4)?,
                file_size: row.get(5)?,
                duration: row.get(6)?,
                status: row.get(7)?,
                transcript: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
                error_message: row.get(11)?,
                progress: row.get::<_, Option<f64>>(12)?.unwrap_or(0.0),
                pipeline_stage: row.get(13)?,
                srt_output: row.get(14)?,
                model_used: row.get(15)?,
                audio_path: row.get(16)?,
                translated_text: row.get(17)?,
                translated_lang: row.get(18)?,
            })
        })
        .map_err(|e| e.to_string())?;
    Ok(rows.next().transpose().map_err(|e| e.to_string())?)
}

pub fn config_get(app: &AppHandle, key: &str) -> Result<Option<String>, String> {
    let conn = open_conn(app)?;
    let v = conn
        .query_row(
            "SELECT value FROM app_config WHERE key = ?1",
            params![key],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(v)
}

pub fn selected_model_filename(app: &AppHandle) -> Result<String, String> {
    config_get(app, "selected_model")?
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "No model selected".to_string())
}

pub fn model_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let name = selected_model_filename(app)?;
    Ok(paths::models_dir(app)?.join(name))
}

/// Sum file sizes under `path` without following symlinks (avoids walking arbitrary trees).
pub fn dir_size(path: &Path) -> u64 {
    let mut total = 0u64;
    let read = match std::fs::read_dir(path) {
        Ok(r) => r,
        Err(_) => return 0,
    };
    for e in read.flatten() {
        let p = e.path();
        let m = match std::fs::symlink_metadata(&p) {
            Ok(m) => m,
            Err(_) => continue,
        };
        if m.is_symlink() {
            total += m.len();
        } else if m.is_dir() {
            total += dir_size(&p);
        } else {
            total += m.len();
        }
    }
    total
}

pub fn file_size64(path: &Path) -> u64 {
    std::fs::metadata(path).map(|m| m.len()).unwrap_or(0)
}

/// Job metadata for a playback audio file (`audio/{job_id}.m4a`).
pub fn job_playback_meta(
    app: &AppHandle,
    job_id: &str,
) -> Result<Option<(String, String, bool)>, String> {
    let conn = open_conn(app)?;
    let row = conn
        .query_row(
            "SELECT filename, source_type, srt_output FROM transcription_jobs WHERE id = ?1",
            params![job_id],
            |row| {
                let srt: Option<String> = row.get(2)?;
                let has_sync = srt.map(|s| !s.trim().is_empty()).unwrap_or(false);
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, has_sync))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(row)
}

pub fn clear_job_audio_path(app: &AppHandle, job_id: &str) -> Result<(), String> {
    let conn = open_conn(app)?;
    conn.execute(
        "UPDATE transcription_jobs SET audio_path = NULL, updated_at = ?1 WHERE id = ?2",
        params![
            chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
            job_id
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

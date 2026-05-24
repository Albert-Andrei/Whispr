mod capture;
mod chunk_transcribe;
mod session;

use crate::paths;
use crate::pipeline;
use serde::Serialize;
use session::RecordSessionHandle;
use std::process::Command;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordStartResult {
    pub session_id: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordStatusResult {
    pub active: bool,
    pub paused: bool,
    pub session_id: Option<String>,
    pub elapsed_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordStopSegment {
    pub start_ms: u64,
    pub end_ms: u64,
    pub text: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordStopResult {
    pub job_id: String,
    pub filename: String,
    pub source_path: String,
    pub audio_path: String,
    pub tail_segments: Vec<RecordStopSegment>,
}

fn session_handle() -> &'static RecordSessionHandle {
    &session::SESSION
}

#[tauri::command]
pub fn record_start(app: AppHandle) -> Result<RecordStartResult, String> {
    paths::ensure_layout(&app)?;
    session_handle().start(app)
}

#[tauri::command]
pub fn record_pause() -> Result<(), String> {
    session_handle().pause()
}

#[tauri::command]
pub fn record_resume(app: AppHandle) -> Result<(), String> {
    session_handle().resume(app)
}

#[tauri::command]
pub fn record_discard() -> Result<(), String> {
    session_handle().discard()
}

#[tauri::command]
pub fn record_status() -> RecordStatusResult {
    session_handle().status()
}

#[tauri::command]
pub async fn record_stop(
    app: AppHandle,
    filename: Option<String>,
) -> Result<RecordStopResult, String> {
    let (session_id, wav_path, _elapsed_ms, tail_segments) = session_handle().stop_and_take_wav()?;

    let job_id = uuid::Uuid::new_v4().to_string();
    let label = filename
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| default_recording_name());
    let filename = if label.ends_with(".m4a") {
        label
    } else {
        format!("{label}.m4a")
    };

    let audio_path = paths::audio_dir(&app)?.join(format!("{job_id}.m4a"));
    convert_wav_to_m4a(&app, &wav_path, &audio_path, &job_id)?;

    let _ = std::fs::remove_file(&wav_path);

    let source_path = audio_path.to_string_lossy().into_owned();
    let audio_path_str = source_path.clone();

    let _ = app.emit(
        "record:state",
        session::RecordStateEvent {
            session_id: session_id.clone(),
            state: "stopped".into(),
        },
    );

    Ok(RecordStopResult {
        job_id,
        filename: filename.trim_end_matches(".m4a").to_string(),
        source_path,
        audio_path: audio_path_str,
        tail_segments: tail_segments
            .into_iter()
            .map(|s| RecordStopSegment {
                start_ms: s.start_ms,
                end_ms: s.end_ms,
                text: s.text,
            })
            .collect(),
    })
}

fn default_recording_name() -> String {
    let now = chrono::Local::now();
    format!("Recording {}", now.format("%Y-%m-%d %H:%M"))
}

fn convert_wav_to_m4a(
    app: &AppHandle,
    wav: &std::path::Path,
    out: &std::path::Path,
    job_id: &str,
) -> Result<(), String> {
    let ffmpeg = paths::ffmpeg_path(app)?;
    if !ffmpeg.is_file() {
        return Err("ffmpeg is not available. The bundled binary may be missing — try reinstalling Whispr.".into());
    }
    let mut child = Command::new(&ffmpeg)
        .arg("-y")
        .arg("-i")
        .arg(wav)
        .arg("-ac")
        .arg("1")
        .arg("-c:a")
        .arg("aac")
        .arg("-b:a")
        .arg("128k")
        .arg(out)
        .spawn()
        .map_err(|e| format!("ffmpeg failed to start: {e}"))?;

    pipeline::register_child(job_id, child.id());
    let status = child.wait().map_err(|e| format!("ffmpeg wait failed: {e}"))?;
    pipeline::unregister_child(job_id);

    if !status.success() {
        let _ = std::fs::remove_file(out);
        return Err("ffmpeg failed to encode recording".into());
    }
    Ok(())
}

#[allow(dead_code)]
pub fn is_recording_active() -> bool {
    session_handle().status().active
}

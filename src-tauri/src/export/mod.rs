mod docx_out;
mod pdf_out;
mod srt_out;
mod txt_out;

use crate::jobs_db;
use serde::Serialize;
use std::path::Path;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportJobData {
    pub id: String,
    pub filename: String,
    pub transcript: String,
    pub srt_output: Option<String>,
    pub created_at: String,
    pub model_used: Option<String>,
    pub duration: Option<String>,
}

fn load_job_export(app: &AppHandle, job_id: &str) -> Result<ExportJobData, String> {
    let row = jobs_db::get_job(app, job_id)?
        .ok_or_else(|| "Job not found".to_string())?;
    let transcript = row
        .transcript
        .filter(|s| !s.is_empty())
        .ok_or("No transcript to export")?;
    Ok(ExportJobData {
        id: row.id,
        filename: row.filename,
        transcript,
        srt_output: row.srt_output,
        created_at: row.created_at,
        model_used: row.model_used,
        duration: row.duration,
    })
}

#[tauri::command]
pub fn export_transcript(
    app: AppHandle,
    job_id: String,
    format: String,
    output_path: String,
) -> Result<(), String> {
    let data = load_job_export(&app, &job_id)?;
    let path = Path::new(&output_path);
    match format.as_str() {
        "txt" => txt_out::write_plain(&data, path, false),
        "txt_timestamps" => txt_out::write_plain(&data, path, true),
        "srt" => srt_out::write_srt(&data, path),
        "pdf" => pdf_out::write_pdf(&data, path),
        "docx" => docx_out::write_docx(&data, path),
        _ => Err(format!("Unknown export format: {format}")),
    }
}

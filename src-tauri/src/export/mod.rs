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
    /// Set when export uses saved translation (e.g. "Translated to English").
    pub translation_note: Option<String>,
}

fn language_label(code: &str) -> &str {
    match code {
        "en" => "English",
        "es" => "Spanish",
        "fr" => "French",
        "de" => "German",
        "it" => "Italian",
        "pt" => "Portuguese",
        "ro" => "Romanian",
        "ru" => "Russian",
        "uk" => "Ukrainian",
        "ja" => "Japanese",
        "zh" => "Chinese",
        _ => code,
    }
}

/// Prefer saved translation when present (matches transcript UI default).
fn pick_export_body(row: &jobs_db::JobRow) -> Result<(String, Option<String>), String> {
    let has_translation = row
        .translated_text
        .as_ref()
        .map(|s| !s.trim().is_empty())
        .unwrap_or(false)
        && row
            .translated_lang
            .as_ref()
            .map(|s| !s.trim().is_empty())
            .unwrap_or(false);

    if has_translation {
        let text = row.translated_text.as_ref().unwrap().trim().to_string();
        let lang = row.translated_lang.as_ref().unwrap().trim();
        let note = format!("Translated to {}", language_label(lang));
        return Ok((text, Some(note)));
    }

    let transcript = row
        .transcript
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .ok_or_else(|| "No transcript to export".to_string())?;
    Ok((transcript, None))
}

fn load_job_export(app: &AppHandle, job_id: &str) -> Result<ExportJobData, String> {
    let row = jobs_db::get_job(app, job_id)?
        .ok_or_else(|| "Job not found".to_string())?;
    let (transcript, translation_note) = pick_export_body(&row)?;
    Ok(ExportJobData {
        id: row.id,
        filename: row.filename,
        transcript,
        srt_output: row.srt_output,
        created_at: row.created_at,
        model_used: row.model_used,
        duration: row.duration,
        translation_note,
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

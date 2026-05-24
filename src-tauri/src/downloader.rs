use crate::paths;
use futures_util::StreamExt;
use serde::Serialize;
use std::fs::File;
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetupProgressPayload {
    pub component: String,
    pub downloaded: u64,
    pub total: Option<u64>,
}

async fn download_to_path(
    app: &AppHandle,
    component: &str,
    url: &str,
    dest: &Path,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let res = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("{component} download failed: {e}"))?;
    if !res.status().is_success() {
        return Err(format!(
            "{component} download HTTP {}",
            res.status()
        ));
    }
    let total = res.content_length();
    let mut stream = res.bytes_stream();
    let mut file = File::create(dest).map_err(|e| e.to_string())?;
    let mut done: u64 = 0;
    let _ = app.emit(
        "setup:progress",
        SetupProgressPayload {
            component: component.to_string(),
            downloaded: 0,
            total,
        },
    );
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        done += chunk.len() as u64;
        let _ = app.emit(
            "setup:progress",
            SetupProgressPayload {
                component: component.to_string(),
                downloaded: done,
                total,
            },
        );
    }
    Ok(())
}

pub fn model_hf_name(tier: &str) -> Result<&'static str, String> {
    match tier {
        "small" => Ok("ggml-small.bin"),
        "medium" => Ok("ggml-medium.bin"),
        "large" => Ok("ggml-large-v3.bin"),
        _ => Err(format!("Unknown model tier: {tier}")),
    }
}

fn model_url(filename: &str) -> String {
    format!("https://huggingface.co/ggerganov/whisper.cpp/resolve/main/{filename}")
}

/// `tier`: `small` | `medium` | `large`
#[tauri::command]
pub async fn download_model_file(app: AppHandle, tier: String) -> Result<(), String> {
    paths::ensure_layout(&app)?;
    let name = model_hf_name(&tier)?;
    let dest: PathBuf = paths::models_dir(&app)?.join(name);
    let url = model_url(name);
    download_to_path(&app, &format!("model:{name}"), &url, &dest).await?;
    Ok(())
}

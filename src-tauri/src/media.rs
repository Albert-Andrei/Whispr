use crate::jobs_db;
use crate::paths;
use serde::Serialize;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaybackMediaItem {
    pub job_id: String,
    pub path: String,
    pub filename: String,
    pub source_type: Option<String>,
    pub bytes: u64,
    /// True when the job has SRT segments used for synced playback in the transcript view.
    pub has_synced_playback: bool,
}

#[tauri::command]
pub async fn list_playback_media(app: AppHandle) -> Result<Vec<PlaybackMediaItem>, String> {
    paths::ensure_layout(&app)?;
    let app2 = app.clone();
    tokio::task::spawn_blocking(move || list_playback_media_sync(&app2))
        .await
        .map_err(|e| e.to_string())?
}

fn list_playback_media_sync(app: &AppHandle) -> Result<Vec<PlaybackMediaItem>, String> {
    let audio_dir = paths::audio_dir(app)?;
    let read = match std::fs::read_dir(&audio_dir) {
        Ok(r) => r,
        Err(_) => return Ok(vec![]),
    };

    let mut items = Vec::new();
    for entry in read.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("m4a") {
            continue;
        }
        let job_id = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_string();
        if job_id.is_empty() {
            continue;
        }
        let bytes = jobs_db::file_size64(&path);
        if bytes == 0 {
            continue;
        }

        let (filename, source_type, has_synced_playback) =
            match jobs_db::job_playback_meta(app, &job_id)? {
                Some((name, st, sync)) => (name, Some(st), sync),
                None => (job_id.clone(), None, false),
            };

        items.push(PlaybackMediaItem {
            job_id,
            path: path.to_string_lossy().into_owned(),
            filename,
            source_type,
            bytes,
            has_synced_playback,
        });
    }

    items.sort_by(|a, b| a.filename.cmp(&b.filename));
    Ok(items)
}

fn remove_playback_file(app: &AppHandle, job_id: &str) {
    if let Ok(dir) = paths::audio_dir(app) {
        let p = dir.join(format!("{job_id}.m4a"));
        let _ = std::fs::remove_file(p);
    }
}

#[tauri::command]
pub async fn delete_playback_media(app: AppHandle, job_id: String) -> Result<(), String> {
    let app2 = app.clone();
    let job_id2 = job_id.clone();
    tokio::task::spawn_blocking(move || {
        remove_playback_file(&app2, &job_id2);
        jobs_db::clear_job_audio_path(&app2, &job_id2)
    })
    .await
    .map_err(|e| e.to_string())?
}

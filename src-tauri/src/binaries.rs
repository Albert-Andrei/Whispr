use crate::jobs_db;
use crate::paths;
use serde::Serialize;
use tauri::AppHandle;

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
    let models = paths::models_dir(&app)?;
    let tmp = paths::tmp_dir(&app)?;
    let audio = paths::audio_dir(&app)?;
    let db = paths::db_path(&app)?;

    tokio::task::spawn_blocking(move || {
        let models_bytes = jobs_db::dir_size(&models);
        let tmp_bytes = jobs_db::dir_size(&tmp);
        let audio_bytes = jobs_db::dir_size(&audio);
        let db_bytes = jobs_db::file_size64(&db);

        let mut categories = vec![
            DiskCategory {
                id: "models".into(),
                label: "Whisper models".into(),
                bytes: models_bytes,
            },
            DiskCategory {
                id: "audio".into(),
                label: "Playback audio".into(),
                bytes: audio_bytes,
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

/// Check if the legacy `bin/` directory (from pre-sidecar versions) exists and
/// contains files. Returns the total size in bytes, or 0 if absent.
#[tauri::command]
pub async fn check_legacy_files(app: AppHandle) -> Result<u64, String> {
    let bin = paths::app_root(&app)?.join("bin");
    Ok(if bin.is_dir() { jobs_db::dir_size(&bin) } else { 0 })
}

/// Remove legacy `bin/` directory left over from pre-sidecar versions.
#[tauri::command]
pub async fn clean_legacy_files(app: AppHandle) -> Result<(), String> {
    let bin = paths::app_root(&app)?.join("bin");
    if bin.is_dir() {
        std::fs::remove_dir_all(&bin).map_err(|e| format!("remove bin: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn reset_all_data(app: AppHandle) -> Result<(), String> {
    let root = paths::app_root(&app)?;
    let dirs = ["models", "audio", "tmp", "bin"];
    for name in dirs {
        let d = root.join(name);
        if d.exists() {
            std::fs::remove_dir_all(&d).map_err(|e| format!("remove {name}: {e}"))?;
        }
    }
    let db = root.join("whispr.db");
    if db.exists() {
        std::fs::remove_file(&db).map_err(|e| format!("remove db: {e}"))?;
    }
    let db_wal = root.join("whispr.db-wal");
    if db_wal.exists() {
        let _ = std::fs::remove_file(&db_wal);
    }
    let db_shm = root.join("whispr.db-shm");
    if db_shm.exists() {
        let _ = std::fs::remove_file(&db_shm);
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

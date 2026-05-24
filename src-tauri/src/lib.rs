mod binaries;
mod downloader;
mod export;
mod jobs_db;
mod media;
mod paths;
mod pipeline;
mod record;
mod translate;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            binaries::get_app_disk_usage,
            binaries::get_recommended_max_concurrent,
            binaries::delete_model_file,
            binaries::list_model_files,
            binaries::reset_all_data,
            binaries::check_legacy_files,
            binaries::clean_legacy_files,
            downloader::download_model_file,
            pipeline::run_pipeline,
            pipeline::fetch_url_title,
            pipeline::cancel_pipeline,
            pipeline::delete_job_assets,
            export::export_transcript,
            translate::translate_text,
            record::record_start,
            record::record_pause,
            record::record_resume,
            record::record_stop,
            record::record_discard,
            record::record_status,
            media::list_playback_media,
            media::delete_playback_media,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

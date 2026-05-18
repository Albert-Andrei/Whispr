mod binaries;
mod downloader;
mod export;
mod jobs_db;
mod paths;
mod pipeline;
mod updates;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            binaries::check_binaries,
            binaries::get_app_disk_usage,
            binaries::get_recommended_max_concurrent,
            binaries::delete_model_file,
            binaries::list_model_files,
            downloader::download_tools,
            downloader::download_model_file,
            pipeline::run_pipeline,
            pipeline::fetch_url_title,
            pipeline::cancel_pipeline,
            export::export_transcript,
            updates::check_for_update,
        ])
        .setup(|app| {
            let h = app.handle().clone();
            if let Err(e) = tauri::async_runtime::block_on(downloader::ensure_bin_tools_at_launch(&h)) {
                eprintln!("Whispr: could not ensure ffmpeg / yt-dlp: {e}");
            }
            downloader::ensure_whisper_cli_linked(&h);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

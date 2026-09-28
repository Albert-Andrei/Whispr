mod download;
mod extract_audio;
mod persist_audio;
pub mod progress;
mod transcribe;

use crate::jobs_db;
use crate::paths;
use progress::{ProgressReporter, StageRange};
use std::cell::Cell;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::sync::Mutex;
use tauri::AppHandle;

static ACTIVE_PIDS: Mutex<Option<HashMap<String, u32>>> = Mutex::new(None);
static CANCELLED: Mutex<Option<HashSet<String>>> = Mutex::new(None);
static RUNNING: Mutex<Option<HashSet<String>>> = Mutex::new(None);

fn pids_map() -> &'static Mutex<Option<HashMap<String, u32>>> {
    &ACTIVE_PIDS
}

fn cancelled_set() -> &'static Mutex<Option<HashSet<String>>> {
    &CANCELLED
}

pub fn register_child(job_id: &str, pid: u32) {
    {
        let mut lock = pids_map().lock().unwrap();
        lock.get_or_insert_with(HashMap::new).insert(job_id.to_string(), pid);
    }
    // Cancel landed between a stage check and this spawn: stop the new tool right away.
    if is_cancelled(job_id) {
        kill_active_child(job_id);
    }
}

pub fn unregister_child(job_id: &str) {
    let mut lock = pids_map().lock().unwrap();
    if let Some(map) = lock.as_mut() {
        map.remove(job_id);
    }
}

pub fn is_cancelled(job_id: &str) -> bool {
    let lock = cancelled_set().lock().unwrap();
    lock.as_ref().map_or(false, |s| s.contains(job_id))
}

fn mark_cancelled(job_id: &str) {
    let mut lock = cancelled_set().lock().unwrap();
    lock.get_or_insert_with(HashSet::new).insert(job_id.to_string());
}

fn clear_cancelled(job_id: &str) {
    let mut lock = cancelled_set().lock().unwrap();
    if let Some(s) = lock.as_mut() {
        s.remove(job_id);
    }
}

fn set_running(job_id: &str, running: bool) {
    let mut lock = RUNNING.lock().unwrap();
    let set = lock.get_or_insert_with(HashSet::new);
    if running {
        set.insert(job_id.to_string());
    } else {
        set.remove(job_id);
    }
}

fn is_running(job_id: &str) -> bool {
    let lock = RUNNING.lock().unwrap();
    lock.as_ref().map_or(false, |s| s.contains(job_id))
}

/// Terminates the job's current tool. Pipeline tools are spawned as their own
/// process group (see `own_process_group`), so helpers they start die too.
fn kill_active_child(job_id: &str) {
    let pid = {
        let lock = pids_map().lock().unwrap();
        lock.as_ref().and_then(|m| m.get(job_id).copied())
    };
    if let Some(pid) = pid {
        let pid = pid as libc::pid_t;
        // SAFETY: plain signal delivery; a stale pid at worst fails with ESRCH.
        unsafe {
            if libc::kill(-pid, libc::SIGTERM) != 0 {
                libc::kill(pid, libc::SIGTERM);
            }
        }
        unregister_child(job_id);
    }
}

/// Spawn the tool as the leader of a new process group so cancel can stop it
/// together with any child processes (yt-dlp's bundled Python, ffmpeg, …).
pub(crate) fn own_process_group(cmd: &mut std::process::Command) -> &mut std::process::Command {
    use std::os::unix::process::CommandExt;
    cmd.process_group(0)
}

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

fn check_cancelled(job_id: &str) -> Result<(), String> {
    if is_cancelled(job_id) {
        Err("Cancelled".into())
    } else {
        Ok(())
    }
}

/// yt-dlp reading the page before any bytes move; reports no percentage.
const FETCH_RANGE: StageRange = StageRange { stage: "fetching", start: 0.0, end: 0.0 };

/// Rough whisper-cli wall-clock seconds per second of audio on Apple Silicon
/// (Metal). Only used to size the download's share of the bar.
fn transcribe_secs_per_audio_sec(model_file: &str) -> f64 {
    let m = model_file.to_lowercase();
    if m.contains("large") {
        0.2
    } else if m.contains("medium") {
        0.1
    } else if m.contains("small") {
        0.04
    } else {
        0.02
    }
}

/// How the overall bar is split between steps. URL jobs start with a guess and
/// re-fit once yt-dlp reports the download ETA and the media length, so a
/// 4-hour video's slow download gets a fair share instead of a fixed slice.
struct StagePlan {
    /// (download end, extract end) as fractions of the whole bar.
    split: Cell<(f64, f64)>,
    fitted: Cell<bool>,
}

impl StagePlan {
    fn new(is_url: bool) -> Self {
        let split = if is_url { (0.15, 0.25) } else { (0.0, 0.08) };
        Self {
            split: Cell::new(split),
            // Local files have nothing to fit.
            fitted: Cell::new(!is_url),
        }
    }

    /// Called on download updates; fits once, while the bar is still near 0
    /// so the overall progress never jumps backwards.
    fn fit_download(&self, p: &download::DownloadProgress, model_file: &str) {
        if self.fitted.get() {
            return;
        }
        let (Some(eta), Some(media)) = (p.eta_secs, p.media_secs) else {
            return;
        };
        // yt-dlp's first speed readings are noisy; wait for ~1% of the file.
        if p.fraction < 0.01 {
            return;
        }
        self.fitted.set(true);
        if p.fraction > 0.05 {
            return;
        }
        let download = eta.max(1.0);
        let convert = media * 0.01;
        let transcribe = media * transcribe_secs_per_audio_sec(model_file);
        let total = download + convert + transcribe;
        let dl_end = (download / total).clamp(0.03, 0.85);
        let ex_end = dl_end + (convert / total).clamp(0.02, 0.10);
        self.split.set((dl_end, ex_end));
    }

    fn download(&self) -> StageRange {
        StageRange { stage: "downloading", start: 0.0, end: self.split.get().0 }
    }

    fn extract(&self) -> StageRange {
        let (dl, ex) = self.split.get();
        StageRange { stage: "extracting", start: dl, end: ex }
    }

    fn transcribe(&self) -> StageRange {
        StageRange { stage: "transcribing", start: self.split.get().1, end: 1.0 }
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
    set_running(&job_id, true);
    // Cancelled while still queued: nothing to do.
    if !jobs_db::set_job_processing(&app, &job_id)? {
        set_running(&job_id, false);
        return Ok(());
    }

    let reporter = ProgressReporter::new(&app, &job_id);
    let plan = StagePlan::new(source_type == "url");

    let model_path = jobs_db::model_path(&app);
    let model_name = jobs_db::selected_model_filename(&app);

    let inner = (|| -> Result<(), String> {
        let model_path = model_path?;
        let model_used = model_name?;
        let model_file = model_used.clone();

        let media_path = if source_type == "url" {
            let url = source_url.ok_or_else(|| "Missing URL".to_string())?;
            reporter.report(FETCH_RANGE, 0.0);
            let p = download::download_url_to_tmp(&app, &job_id, &url, &|p| {
                plan.fit_download(&p, &model_file);
                reporter.report(plan.download(), p.fraction);
            })?;
            check_cancelled(&job_id)?;
            reporter.report(plan.download(), 1.0);
            p
        } else {
            let sp = source_path.ok_or_else(|| "Missing file path".to_string())?;
            let p = download::resolve_media_path(&app, &sp);
            if !p.is_file() {
                return Err(format!("File not found: {}", p.display()));
            }
            p
        };

        check_cancelled(&job_id)?;
        reporter.report(plan.extract(), 0.0);
        // Recordings are already stored as playable audio; everything else gets
        // a compact playback copy encoded in the same ffmpeg pass as the WAV.
        let (wav, playback_audio) = extract_audio::extract_audio(
            &app,
            &job_id,
            &media_path,
            source_type != "record",
            &|pct| reporter.report(plan.extract(), pct),
        )?;
        let audio_path = if source_type == "record" {
            Some(media_path.clone())
        } else {
            playback_audio
        };
        reporter.report(plan.extract(), 1.0);

        check_cancelled(&job_id)?;
        reporter.report(plan.transcribe(), 0.0);
        let (text, srt, dur) = transcribe::transcribe_file(&app, &job_id, &wav, &model_path, &|pct| {
            reporter.report(plan.transcribe(), pct);
        })?;

        check_cancelled(&job_id)?;
        reporter.report(plan.transcribe(), 1.0);
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
            audio_path.as_deref().and_then(|p| p.to_str()),
        )?;
        Ok(())
    })();

    cleanup_job_tmp(&app, &job_id);
    let was_cancelled = is_cancelled(&job_id);
    clear_cancelled(&job_id);
    unregister_child(&job_id);
    set_running(&job_id, false);

    match inner {
        Ok(()) => Ok(()),
        Err(_) if was_cancelled => {
            if source_type != "record" {
                persist_audio::remove_job_audio(&app, &job_id);
            }
            let _ = jobs_db::set_job_cancelled(&app, &job_id);
            Ok(())
        }
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

#[tauri::command]
pub async fn fetch_url_title(app: AppHandle, url: String, job_id: String) -> Result<Option<String>, String> {
    tokio::task::spawn_blocking(move || {
        let title = download::fetch_url_title(&app, &url);
        if let Some(ref t) = title {
            let _ = jobs_db::set_job_filename(&app, &job_id, t);
        }
        Ok(title)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn delete_job_assets(app: AppHandle, job_id: String) -> Result<(), String> {
    persist_audio::remove_job_audio(&app, &job_id);
    cleanup_job_tmp(&app, &job_id);
    Ok(())
}

#[tauri::command]
pub async fn cancel_pipeline(app: AppHandle, job_id: String) -> Result<(), String> {
    // Only flag jobs that are actually running: a stale flag would make a later retry abort.
    if is_running(&job_id) {
        mark_cancelled(&job_id);
        kill_active_child(&job_id);
    }
    jobs_db::set_job_cancelled(&app, &job_id)?;
    Ok(())
}

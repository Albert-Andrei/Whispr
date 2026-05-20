use super::capture::{CaptureThread, ChunkJob, CHUNK_SECONDS};
use super::chunk_transcribe;
use crate::paths;
use serde::Serialize;
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordSegmentEvent {
    pub session_id: String,
    pub start_ms: u64,
    pub end_ms: u64,
    pub text: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordStateEvent {
    pub session_id: String,
    pub state: String,
}

#[derive(Debug, PartialEq, Eq)]
pub enum SessionStateKind {
    Recording,
    Paused,
}

pub struct ActiveSession {
    pub session_id: String,
    pub state: SessionStateKind,
    pub capture: CaptureThread,
    pub chunk_worker: JoinHandle<()>,
    pub session_start: Instant,
    pub paused_total: Duration,
    pub pause_started: Option<Instant>,
    pub app: AppHandle,
    pub cancelled: Arc<Mutex<bool>>,
    pub segment_collector: Arc<Mutex<Vec<RecordSegmentEvent>>>,
}

pub struct RecordSessionHandle {
    inner: Mutex<Option<ActiveSession>>,
}

impl RecordSessionHandle {
    pub fn start(&self, app: AppHandle) -> Result<super::RecordStartResult, String> {
        let mut lock = self.inner.lock().unwrap();
        if lock.is_some() {
            return Err("A recording session is already active".into());
        }

        let session_id = uuid::Uuid::new_v4().to_string();
        let samples = Arc::new(Mutex::new(Vec::<f32>::new()));
        let (chunk_tx, chunk_rx) = std::sync::mpsc::channel::<ChunkJob>();
        let cancelled = Arc::new(Mutex::new(false));
        let segment_collector = Arc::new(Mutex::new(Vec::new()));

        let capture = CaptureThread::start(
            app.clone(),
            session_id.clone(),
            Arc::clone(&samples),
            chunk_tx,
        )?;

        let chunk_app = app.clone();
        let chunk_session = session_id.clone();
        let chunk_cancelled = Arc::clone(&cancelled);
        let chunk_collector = Arc::clone(&segment_collector);
        let chunk_worker = thread::spawn(move || {
            chunk_worker_loop(
                chunk_rx,
                chunk_app,
                chunk_session,
                chunk_cancelled,
                chunk_collector,
            );
        });

        let session = ActiveSession {
            session_id: session_id.clone(),
            state: SessionStateKind::Recording,
            capture,
            chunk_worker,
            session_start: Instant::now(),
            paused_total: Duration::ZERO,
            pause_started: None,
            app: app.clone(),
            cancelled,
            segment_collector,
        };

        let _ = app.emit(
            "record:state",
            RecordStateEvent {
                session_id: session_id.clone(),
                state: "recording".into(),
            },
        );

        *lock = Some(session);
        Ok(super::RecordStartResult { session_id })
    }

    pub fn pause(&self) -> Result<(), String> {
        let mut lock = self.inner.lock().unwrap();
        let session = lock
            .as_mut()
            .ok_or_else(|| "No active recording session".to_string())?;
        if session.state != SessionStateKind::Recording {
            return Err("Recording is not active".into());
        }
        session.state = SessionStateKind::Paused;
        session.pause_started = Some(Instant::now());
        session.capture.set_paused(true);
        let _ = session.app.emit(
            "record:state",
            RecordStateEvent {
                session_id: session.session_id.clone(),
                state: "paused".into(),
            },
        );
        Ok(())
    }

    pub fn resume(&self, app: AppHandle) -> Result<(), String> {
        let mut lock = self.inner.lock().unwrap();
        let session = lock
            .as_mut()
            .ok_or_else(|| "No active recording session".to_string())?;
        if session.state != SessionStateKind::Paused {
            return Err("Recording is not paused".into());
        }
        if let Some(started) = session.pause_started.take() {
            session.paused_total += started.elapsed();
        }
        session.state = SessionStateKind::Recording;
        session.capture.set_paused(false);
        session.app = app.clone();
        let _ = session.app.emit(
            "record:state",
            RecordStateEvent {
                session_id: session.session_id.clone(),
                state: "recording".into(),
            },
        );
        Ok(())
    }

    pub fn discard(&self) -> Result<(), String> {
        let mut lock = self.inner.lock().unwrap();
        let mut session = lock
            .take()
            .ok_or_else(|| "No active recording session".to_string())?;

        *session.cancelled.lock().unwrap() = true;
        let session_id = session.session_id.clone();
        session.capture.discard();
        let _ = session.chunk_worker.join();

        cleanup_session_tmp(&session.app, &session_id);

        let _ = session.app.emit(
            "record:state",
            RecordStateEvent {
                session_id: session_id.clone(),
                state: "discarded".into(),
            },
        );
        Ok(())
    }

    pub fn status(&self) -> super::RecordStatusResult {
        let lock = self.inner.lock().unwrap();
        if let Some(session) = lock.as_ref() {
            let elapsed = session.elapsed_ms();
            super::RecordStatusResult {
                active: true,
                paused: session.state == SessionStateKind::Paused,
                session_id: Some(session.session_id.clone()),
                elapsed_ms: elapsed,
            }
        } else {
            super::RecordStatusResult {
                active: false,
                paused: false,
                session_id: None,
                elapsed_ms: 0,
            }
        }
    }

    pub fn stop_and_take_wav(
        &self,
    ) -> Result<(String, std::path::PathBuf, u64, Vec<RecordSegmentEvent>), String> {
        let mut lock = self.inner.lock().unwrap();
        let mut session = lock
            .take()
            .ok_or_else(|| "No active recording session".to_string())?;

        if session.state == SessionStateKind::Paused {
            if let Some(started) = session.pause_started.take() {
                session.paused_total += started.elapsed();
            }
        }

        let elapsed_ms = session.elapsed_ms();
        let session_id = session.session_id.clone();
        let sample_rate = session.capture.sample_rate();
        let wav_path = session.capture.wav_path().to_path_buf();
        let collector = Arc::clone(&session.segment_collector);

        collector.lock().unwrap().clear();
        session.capture.stop();
        let _ = session.chunk_worker.join();

        let samples = session.capture.take_samples();
        let min_samples = (sample_rate as f64 * 0.5) as usize;
        if samples.len() < min_samples {
            return Err("Recording is too short. Speak for at least half a second.".into());
        }
        super::capture::write_wav_mono_16k(&wav_path, &samples, sample_rate)?;

        let tail_segments = collector.lock().unwrap().clone();
        Ok((session_id, wav_path, elapsed_ms, tail_segments))
    }
}

impl ActiveSession {
    fn elapsed_ms(&self) -> u64 {
        let mut paused = self.paused_total;
        if let Some(started) = self.pause_started {
            paused += started.elapsed();
        }
        self.session_start
            .elapsed()
            .saturating_sub(paused)
            .as_millis() as u64
    }
}

pub static SESSION: RecordSessionHandle = RecordSessionHandle {
    inner: Mutex::new(None),
};

fn chunk_worker_loop(
    rx: std::sync::mpsc::Receiver<ChunkJob>,
    app: AppHandle,
    session_id: String,
    cancelled: Arc<Mutex<bool>>,
    segment_collector: Arc<Mutex<Vec<RecordSegmentEvent>>>,
) {
    while let Ok(job) = rx.recv() {
        if *cancelled.lock().unwrap() {
            let _ = std::fs::remove_file(&job.wav_path);
            continue;
        }

        let end_ms = job.start_ms + (CHUNK_SECONDS * 1000.0) as u64;
        match chunk_transcribe::transcribe_chunk(&app, &job.wav_path) {
            Ok(text) if !text.trim().is_empty() => {
                let event = RecordSegmentEvent {
                    session_id: session_id.clone(),
                    start_ms: job.start_ms,
                    end_ms,
                    text: text.trim().to_string(),
                };
                segment_collector.lock().unwrap().push(event.clone());
                let _ = app.emit("record:segment", event);
            }
            Ok(_) => {}
            Err(e) => eprintln!("Whispr live chunk transcribe: {e}"),
        }

        let _ = std::fs::remove_file(&job.wav_path);
    }
}

fn cleanup_session_tmp(app: &AppHandle, session_id: &str) {
    if let Ok(tmp) = paths::tmp_dir(app) {
        let wav = tmp.join(format!("{session_id}.wav"));
        let _ = std::fs::remove_file(wav);
        if let Ok(read) = std::fs::read_dir(&tmp) {
            for e in read.flatten() {
                let name = e.file_name().to_string_lossy().into_owned();
                if name.starts_with(session_id) {
                    let _ = std::fs::remove_file(e.path());
                }
            }
        }
    }
}

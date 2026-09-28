use crate::jobs_db;
use serde::Serialize;
use std::cell::Cell;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineProgress {
    pub job_id: String,
    pub stage: String,
    /// Overall job progress, 0..1.
    pub percent: f64,
    /// Progress within the current stage, 0..1 (drives the time-left estimate).
    pub stage_percent: f64,
}

/// Slice of the overall progress bar a stage occupies.
#[derive(Debug, Clone, Copy)]
pub struct StageRange {
    pub stage: &'static str,
    pub start: f64,
    pub end: f64,
}

const DB_WRITE_INTERVAL: Duration = Duration::from_millis(1000);

/// Emits `pipeline:progress` for every update and persists it to the DB at most once a second.
pub struct ProgressReporter<'a> {
    app: &'a AppHandle,
    job_id: &'a str,
    last_db_write: Cell<Option<Instant>>,
}

impl<'a> ProgressReporter<'a> {
    pub fn new(app: &'a AppHandle, job_id: &'a str) -> Self {
        Self {
            app,
            job_id,
            last_db_write: Cell::new(None),
        }
    }

    pub fn report(&self, range: StageRange, stage_percent: f64) {
        if super::is_cancelled(self.job_id) {
            return;
        }
        let stage_percent = stage_percent.clamp(0.0, 1.0);
        let overall = range.start + (range.end - range.start) * stage_percent;
        let _ = self.app.emit(
            "pipeline:progress",
            PipelineProgress {
                job_id: self.job_id.to_string(),
                stage: range.stage.to_string(),
                percent: overall,
                stage_percent,
            },
        );

        let now = Instant::now();
        let due = self
            .last_db_write
            .get()
            .map_or(true, |t| now.duration_since(t) >= DB_WRITE_INTERVAL);
        if due || stage_percent == 0.0 || stage_percent >= 1.0 {
            self.last_db_write.set(Some(now));
            let _ = jobs_db::set_job_progress(self.app, self.job_id, overall, Some(range.stage));
        }
    }
}

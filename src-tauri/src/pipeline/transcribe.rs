use super::progress::PipelineProgress;
use crate::paths;
use hound::WavReader;
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::{AppHandle, Emitter};

fn format_duration(seconds: u64) -> String {
    let h = seconds / 3600;
    let m = (seconds % 3600) / 60;
    let s = seconds % 60;
    if h > 0 {
        format!("{h}:{m:02}:{s:02}")
    } else {
        format!("{m}:{s:02}")
    }
}

pub fn transcribe_file(
    app: &AppHandle,
    job_id: &str,
    wav_path: &Path,
    model_path: &Path,
    progress_base: f64,
    progress_span: f64,
) -> Result<(String, String, Option<String>), String> {
    let cli = paths::whisper_cli_path(app)?;
    if !cli.exists() {
        return Err(
            "whisper-cli is not available. Open Whispr again so it can install whisper-cpp via Homebrew, or install Homebrew from https://brew.sh if needed.".into(),
        );
    }

    let tmp = paths::tmp_dir(app)?;
    let out_prefix = tmp.join(job_id);
    let out_str = out_prefix.to_str().ok_or("Invalid temp path")?.to_string();

    let _ = fs::remove_file(format!("{out_str}.txt"));
    let _ = fs::remove_file(format!("{out_str}.srt"));

    let _ = app.emit(
        "pipeline:progress",
        PipelineProgress {
            job_id: job_id.to_string(),
            stage: "transcribing".into(),
            percent: progress_base,
        },
    );

    let status = Command::new(&cli)
        .arg("-m")
        .arg(model_path)
        .arg("-f")
        .arg(wav_path)
        .arg("-of")
        .arg(&out_str)
        .arg("-otxt")
        .arg("-osrt")
        .status()
        .map_err(|e| format!("whisper-cli failed to start: {e}"))?;

    if !status.success() {
        return Err("whisper-cli exited with an error".into());
    }

    let _ = app.emit(
        "pipeline:progress",
        PipelineProgress {
            job_id: job_id.to_string(),
            stage: "transcribing".into(),
            percent: (progress_base + progress_span).min(1.0),
        },
    );

    let txt_path = format!("{out_str}.txt");
    let srt_path = format!("{out_str}.srt");
    let transcript = fs::read_to_string(&txt_path).map_err(|e| e.to_string())?;
    let srt = fs::read_to_string(&srt_path).unwrap_or_default();

    let duration_label = WavReader::open(wav_path).ok().and_then(|reader| {
        let spec = reader.spec();
        let total = reader.len() as u64;
        let rate = spec.sample_rate as u64;
        let ch = spec.channels as u64;
        if rate == 0 || ch == 0 {
            return None;
        }
        let secs = total / (rate * ch);
        Some(format_duration(secs))
    });

    Ok((
        transcript.trim().to_string(),
        srt,
        duration_label,
    ))
}

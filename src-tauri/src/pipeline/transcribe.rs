use crate::paths;
use hound::WavReader;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::thread;
use tauri::AppHandle;

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
    on_progress: &dyn Fn(f64),
) -> Result<(String, String, Option<String>), String> {
    let cli = paths::whisper_cli_path(app)?;
    if !cli.exists() {
        return Err("whisper-cli is not available. The bundled binary may be missing or corrupted — try reinstalling Whispr.".into());
    }

    let tmp = paths::tmp_dir(app)?;
    let out_prefix = tmp.join(job_id);
    let out_str = out_prefix.to_str().ok_or("Invalid temp path")?.to_string();

    let _ = fs::remove_file(format!("{out_str}.txt"));
    let _ = fs::remove_file(format!("{out_str}.srt"));

    let audio_secs = wav_duration_secs(wav_path);

    let mut cmd = Command::new(&cli);
    super::own_process_group(&mut cmd);
    let mut child = cmd
        .arg("-m")
        .arg(model_path)
        .arg("-f")
        .arg(wav_path)
        .arg("-l")
        .arg("auto")
        .arg("-pp")
        .arg("-of")
        .arg(&out_str)
        .arg("-otxt")
        .arg("-osrt")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("whisper-cli failed to start: {e}"))?;

    super::register_child(job_id, child.id());

    // Two progress sources, read concurrently so neither pipe can fill up:
    // stdout segment timestamps ("[00:01:02.000 --> 00:01:05.500] …", fine-grained)
    // and stderr's -pp callback ("progress = 45%", coarse but authoritative).
    let (tx, rx) = mpsc::channel::<f64>();
    let stdout_reader = child.stdout.take().map(|stdout| {
        let tx = tx.clone();
        thread::spawn(move || {
            for line in BufReader::new(stdout).lines().map_while(Result::ok) {
                if let (Some(total), Some(end)) = (audio_secs, parse_segment_end(&line)) {
                    if total > 0.0 {
                        let _ = tx.send(end / total);
                    }
                }
            }
        })
    });
    let stderr_reader = child.stderr.take().map(|stderr| {
        let tx = tx.clone();
        thread::spawn(move || {
            for line in BufReader::new(stderr).lines().map_while(Result::ok) {
                if let Some(pct) = parse_whisper_progress(&line) {
                    let _ = tx.send(pct);
                }
            }
        })
    });
    drop(tx);

    let mut best = 0.0_f64;
    for pct in rx {
        // Never step backwards; stay below 100% until the process has exited.
        let pct = pct.clamp(0.0, 0.99);
        if pct > best {
            best = pct;
            on_progress(best);
        }
    }
    if let Some(h) = stdout_reader {
        let _ = h.join();
    }
    if let Some(h) = stderr_reader {
        let _ = h.join();
    }

    let status = child.wait().map_err(|e| format!("whisper-cli wait failed: {e}"))?;
    super::unregister_child(job_id);

    if super::is_cancelled(job_id) {
        return Err("Cancelled".into());
    }
    if !status.success() {
        return Err("whisper-cli exited with an error".into());
    }

    let txt_path = format!("{out_str}.txt");
    let srt_path = format!("{out_str}.srt");
    let transcript = fs::read_to_string(&txt_path).map_err(|e| e.to_string())?;
    let srt = fs::read_to_string(&srt_path).unwrap_or_default();

    let duration_label = audio_secs.map(|secs| format_duration(secs as u64));

    Ok((
        transcript.trim().to_string(),
        srt,
        duration_label,
    ))
}

fn wav_duration_secs(wav_path: &Path) -> Option<f64> {
    let reader = WavReader::open(wav_path).ok()?;
    let spec = reader.spec();
    let rate = spec.sample_rate as f64;
    let ch = spec.channels as f64;
    if rate == 0.0 || ch == 0.0 {
        return None;
    }
    Some(reader.len() as f64 / (rate * ch))
}

/// End time in seconds of a printed segment: "[00:01:02.000 --> 00:01:05.500]   text"
fn parse_segment_end(line: &str) -> Option<f64> {
    let inner = line.trim_start().strip_prefix('[')?;
    let (_, rest) = inner.split_once("-->")?;
    let end = rest.split(']').next()?.trim();
    let mut parts = end.split(':');
    let h: f64 = parts.next()?.parse().ok()?;
    let m: f64 = parts.next()?.parse().ok()?;
    let s: f64 = parts.next()?.parse().ok()?;
    Some(h * 3600.0 + m * 60.0 + s)
}

/// Parses lines like "whisper_print_progress_callback: progress =  42%"
fn parse_whisper_progress(line: &str) -> Option<f64> {
    let marker = "progress =";
    let idx = line.find(marker)?;
    let rest = &line[idx + marker.len()..];
    let pct_str = rest.trim().trim_end_matches('%');
    pct_str.trim().parse::<f64>().ok().map(|v| v / 100.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_whisper_output() {
        assert_eq!(
            parse_segment_end("[00:01:02.000 --> 00:01:05.500]   Hello there."),
            Some(65.5)
        );
        assert_eq!(parse_segment_end("whisper_init: loading model"), None);
        assert_eq!(
            parse_whisper_progress("whisper_print_progress_callback: progress =  45%"),
            Some(0.45)
        );
    }
}

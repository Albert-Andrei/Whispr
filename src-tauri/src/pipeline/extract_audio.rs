use super::persist_audio;
use crate::paths;
use std::io::{BufReader, Read};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::AppHandle;

/// Decodes the source once into the 16 kHz mono WAV whisper needs and, when
/// `with_playback` is set, a compact M4A copy for in-app playback. Reports
/// 0..1 progress from ffmpeg's own `time=` output.
///
/// With `clip` (start, end seconds) only that part of the input is decoded, so
/// both outputs — and the transcript's timestamps — start at the clip start.
///
/// Returns the WAV path and the playback copy (None if it was not requested or
/// could not be encoded — playback is optional, transcription is not).
pub fn extract_audio(
    app: &AppHandle,
    job_id: &str,
    input: &Path,
    clip: Option<(f64, f64)>,
    with_playback: bool,
    on_progress: &dyn Fn(f64),
) -> Result<(PathBuf, Option<PathBuf>), String> {
    paths::ensure_layout(app)?;
    let ffmpeg = paths::ffmpeg_path(app)?;
    if !ffmpeg.is_file() {
        return Err("ffmpeg is not available. The bundled binary may be missing — try reinstalling Whispr.".into());
    }
    let wav = paths::tmp_dir(app)?.join(format!("{job_id}.wav"));

    if with_playback {
        let m4a = persist_audio::playback_audio_path(app, job_id)?;
        let mut cmd = Command::new(&ffmpeg);
        push_input(&mut cmd, input, clip);
        push_playback_output(&mut cmd, &m4a);
        push_wav_output(&mut cmd, &wav);
        match run_ffmpeg(cmd, job_id, clip_len(clip), on_progress) {
            Ok(()) => return Ok((wav, Some(m4a))),
            Err(e) if e == "Cancelled" => {
                let _ = std::fs::remove_file(&m4a);
                return Err(e);
            }
            // Fall through: retry without the playback copy.
            Err(_) => {
                let _ = std::fs::remove_file(&m4a);
            }
        }
    }

    let mut cmd = Command::new(&ffmpeg);
    push_input(&mut cmd, input, clip);
    push_wav_output(&mut cmd, &wav);
    run_ffmpeg(cmd, job_id, clip_len(clip), on_progress)?;
    Ok((wav, None))
}

fn clip_len(clip: Option<(f64, f64)>) -> Option<f64> {
    clip.map(|(start, end)| (end - start).max(0.001))
}

fn push_input(cmd: &mut Command, input: &Path, clip: Option<(f64, f64)>) {
    cmd.arg("-y").arg("-nostdin");
    if let Some((start, end)) = clip {
        // Input-side seek: fast, and accurate because we re-encode.
        cmd.arg("-ss")
            .arg(format!("{start:.3}"))
            .arg("-t")
            .arg(format!("{:.3}", (end - start).max(0.001)));
    }
    cmd.arg("-i").arg(input);
}

fn push_playback_output(cmd: &mut Command, out: &Path) {
    cmd.args(["-map", "0:a:0", "-vn", "-ac", "1", "-c:a", "aac", "-b:a", "128k"])
        .arg(out);
}

fn push_wav_output(cmd: &mut Command, out: &Path) {
    cmd.args(["-map", "0:a:0", "-vn", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le"])
        .arg(out);
}

/// `known_total` overrides the input's Duration when only part of it is decoded.
fn run_ffmpeg(
    mut cmd: Command,
    job_id: &str,
    known_total: Option<f64>,
    on_progress: &dyn Fn(f64),
) -> Result<(), String> {
    super::own_process_group(&mut cmd);
    let mut child = cmd
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("ffmpeg failed to start: {e}"))?;

    super::register_child(job_id, child.id());

    let mut tail = String::new();
    if let Some(stderr) = child.stderr.take() {
        let mut total_secs: Option<f64> = known_total;
        // ffmpeg rewrites its stats line with '\r', so split on both line endings.
        for line in split_cr_lf(BufReader::new(stderr)) {
            if total_secs.is_none() {
                total_secs = parse_duration_line(&line);
            }
            if let (Some(total), Some(done)) = (total_secs, parse_time_field(&line)) {
                if total > 0.0 {
                    on_progress(done / total);
                }
            }
            tail = line;
        }
    }

    let status = child.wait().map_err(|e| format!("ffmpeg wait failed: {e}"))?;
    super::unregister_child(job_id);

    if super::is_cancelled(job_id) {
        return Err("Cancelled".into());
    }
    if !status.success() {
        let detail = tail.trim();
        return Err(if detail.is_empty() {
            "ffmpeg exited with an error".into()
        } else {
            format!("ffmpeg exited with an error: {detail}")
        });
    }
    Ok(())
}

pub(super) fn split_cr_lf<R: Read>(reader: R) -> impl Iterator<Item = String> {
    let mut bytes = reader.bytes();
    std::iter::from_fn(move || {
        let mut buf = Vec::new();
        loop {
            match bytes.next() {
                Some(Ok(b'\r' | b'\n')) => {
                    if buf.is_empty() {
                        continue;
                    }
                    break;
                }
                Some(Ok(b)) => buf.push(b),
                Some(Err(_)) | None => {
                    if buf.is_empty() {
                        return None;
                    }
                    break;
                }
            }
        }
        Some(String::from_utf8_lossy(&buf).into_owned())
    })
}

/// "  Duration: 00:47:25.12, start: 0.000000, bitrate: 128 kb/s"
pub(super) fn parse_duration_line(line: &str) -> Option<f64> {
    let rest = line.trim_start().strip_prefix("Duration:")?;
    parse_clock(rest.split(',').next()?.trim())
}

/// "size=  1024kB time=00:01:23.45 bitrate=..." → seconds
pub(super) fn parse_time_field(line: &str) -> Option<f64> {
    let idx = line.find("time=")?;
    let value = line[idx + 5..].split_whitespace().next()?;
    parse_clock(value)
}

fn parse_clock(s: &str) -> Option<f64> {
    let mut parts = s.split(':');
    let h: f64 = parts.next()?.parse().ok()?;
    let m: f64 = parts.next()?.parse().ok()?;
    let sec: f64 = parts.next()?.parse().ok()?;
    Some(h * 3600.0 + m * 60.0 + sec)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_ffmpeg_duration_and_time() {
        assert_eq!(
            parse_duration_line("  Duration: 00:47:25.12, start: 0.000000, bitrate: 128 kb/s"),
            Some(2845.12)
        );
        assert_eq!(
            parse_time_field("size=     53kB time=00:01:03.88 bitrate= 112.0kbits/s speed=45.9x"),
            Some(63.88)
        );
        assert_eq!(parse_time_field("size=N/A time=N/A bitrate=N/A"), None);
    }

    #[test]
    fn splits_carriage_return_stats() {
        let lines: Vec<String> = split_cr_lf("a\r\rb\nc\r\n".as_bytes()).collect();
        assert_eq!(lines, ["a", "b", "c"]);
    }
}

use super::ExportJobData;
use std::fs::File;
use std::io::Write;
use std::path::Path;

pub fn write_srt(data: &ExportJobData, path: &Path) -> Result<(), String> {
    let srt = data
        .srt_output
        .as_ref()
        .filter(|s| !s.trim().is_empty())
        .ok_or("No SRT data for this job".to_string())?;
    let mut file = File::create(path).map_err(|e| e.to_string())?;
    file.write_all(srt.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

/// Turn SRT blocks into lines like `[00:00:01,000] text`
pub fn srt_to_timestamped_text(srt: &str) -> String {
    let mut out = String::new();
    let mut lines = srt.lines().peekable();
    while lines.peek().is_some() {
        let _ = lines.next();
        let time_line = lines.next().unwrap_or("");
        let mut body = String::new();
        while let Some(l) = lines.next() {
            if l.trim().is_empty() {
                break;
            }
            if !body.is_empty() {
                body.push(' ');
            }
            body.push_str(l);
        }
        if !time_line.contains("-->") {
            continue;
        }
        let times: Vec<&str> = time_line.split("-->").map(|s| s.trim()).collect();
        if times.len() >= 2 && !body.is_empty() {
            out.push_str(&format!("[{} – {}] {}\n", times[0], times[1], body));
        }
    }
    if out.is_empty() {
        return srt.to_string();
    }
    out
}

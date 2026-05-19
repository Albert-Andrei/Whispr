use super::ExportJobData;
use std::fs::File;
use std::io::Write;
use std::path::Path;

pub fn write_plain(data: &ExportJobData, path: &Path, with_timestamps: bool) -> Result<(), String> {
    let mut file = File::create(path).map_err(|e| e.to_string())?;
    if let Some(ref note) = data.translation_note {
        file.write_all(note.as_bytes()).map_err(|e| e.to_string())?;
        file.write_all(b"\n\n").map_err(|e| e.to_string())?;
    }
    // Timestamps apply to the original SRT only; translated text has no timed track.
    if with_timestamps && data.translation_note.is_none() {
        if let Some(ref srt) = data.srt_output {
            let text = crate::export::srt_out::srt_to_timestamped_text(srt);
            file.write_all(text.as_bytes()).map_err(|e| e.to_string())?;
        } else {
            file.write_all(data.transcript.as_bytes())
                .map_err(|e| e.to_string())?;
            file.write_all(b"\n\n(No subtitle timestamps available.)")
                .map_err(|e| e.to_string())?;
        }
    } else {
        file.write_all(data.transcript.as_bytes())
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

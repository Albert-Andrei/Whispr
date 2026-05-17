use super::ExportJobData;
use std::fs::File;
use std::io::Write;
use std::path::Path;

pub fn write_plain(data: &ExportJobData, path: &Path, with_timestamps: bool) -> Result<(), String> {
    let mut file = File::create(path).map_err(|e| e.to_string())?;
    if with_timestamps {
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

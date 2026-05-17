use super::ExportJobData;
use docx_rs::{Docx, Paragraph, Run};
use std::fs::File;
use std::io::Write;
use std::path::Path;

pub fn write_docx(data: &ExportJobData, path: &Path) -> Result<(), String> {
    let mut docx = Docx::new();
    let title = format!("{} — {}", data.filename, data.created_at);
    docx = docx.add_paragraph(Paragraph::new().add_run(Run::new().add_text(&title)));

    if let Some(ref d) = data.duration {
        docx = docx.add_paragraph(Paragraph::new().add_run(Run::new().add_text(format!("Duration: {d}"))));
    }
    if let Some(ref m) = data.model_used {
        docx = docx.add_paragraph(Paragraph::new().add_run(Run::new().add_text(format!("Model: {m}"))));
    }

    docx = docx.add_paragraph(Paragraph::new().add_run(Run::new().add_text("")));

    for block in data.transcript.split('\n') {
        let line = block.trim();
        if line.is_empty() {
            continue;
        }
        docx = docx.add_paragraph(Paragraph::new().add_run(Run::new().add_text(line)));
    }

    let mut buf = std::io::Cursor::new(Vec::<u8>::new());
    docx.build().pack(&mut buf).map_err(|e| e.to_string())?;
    let mut file = File::create(path).map_err(|e| e.to_string())?;
    file.write_all(buf.get_ref()).map_err(|e| e.to_string())?;
    Ok(())
}

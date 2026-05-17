use super::ExportJobData;
use printpdf::{BuiltinFont, Mm, PdfDocument};
use std::fs::File;
use std::io::BufWriter;
use std::path::Path;

pub fn write_pdf(data: &ExportJobData, path: &Path) -> Result<(), String> {
    let (doc, page1, layer1) =
        PdfDocument::new(&data.filename, Mm(210.0), Mm(297.0), "Transcript");
    let font = doc
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| e.to_string())?;
    let current_layer = doc.get_page(page1).get_layer(layer1);

    let mut y: f64 = 280.0;
    let line_h: f64 = 5.0;
    let margin: f64 = 15.0;

    let emit = |text: &str, y: &mut f64| {
        let truncated: String = text.chars().take(500).collect();
        current_layer.use_text(&truncated, 10.0, Mm(margin), Mm(*y), &font);
        *y -= line_h;
    };

    emit(&format!("{} — {}", data.filename, data.created_at), &mut y);
    emit("", &mut y);
    if let Some(ref d) = data.duration {
        emit(&format!("Duration: {d}"), &mut y);
    }
    if let Some(ref m) = data.model_used {
        emit(&format!("Model: {m}"), &mut y);
    }
    emit("", &mut y);

    for paragraph in data.transcript.split('\n') {
        let p = paragraph.trim();
        if p.is_empty() {
            continue;
        }
        let chars: Vec<char> = p.chars().collect();
        for chunk in chars.chunks(90) {
            if y < 18.0 {
                break;
            }
            let line: String = chunk.iter().collect();
            emit(&line, &mut y);
        }
        y -= 2.0;
        if y < 18.0 {
            break;
        }
    }

    let file = File::create(path).map_err(|e| e.to_string())?;
    let mut writer = BufWriter::new(file);
    doc.save(&mut writer).map_err(|e| e.to_string())?;
    Ok(())
}

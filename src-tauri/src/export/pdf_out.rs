use super::ExportJobData;
use printpdf::indices::{PdfLayerIndex, PdfPageIndex};
use printpdf::{IndirectFontRef, Mm, PdfDocument, PdfDocumentReference, PdfLayerReference};
use std::fs::File;
use std::io::{BufWriter, Cursor};
use std::path::Path;

const PAGE_W: f64 = 210.0;
const PAGE_H: f64 = 297.0;
const MARGIN_MM: f64 = 15.0;
const LINE_HEIGHT_MM: f64 = 5.0;
const FONT_SIZE: f64 = 10.0;
const MAX_CHARS_PER_LINE: usize = 90;
const BOTTOM_MM: f64 = 18.0;

struct PdfWriter<'a> {
    doc: &'a PdfDocumentReference,
    page: PdfPageIndex,
    layer: PdfLayerIndex,
    font: &'a IndirectFontRef,
    y: f64,
}

impl<'a> PdfWriter<'a> {
    fn current_layer(&self) -> PdfLayerReference {
        self.doc.get_page(self.page).get_layer(self.layer)
    }

    fn new_page(&mut self) {
        let (page, layer) = self.doc.add_page(Mm(PAGE_W), Mm(PAGE_H), "Transcript");
        self.page = page;
        self.layer = layer;
        self.y = PAGE_H - MARGIN_MM;
    }

    fn ensure_space(&mut self, lines_needed: f64) {
        if self.y - lines_needed * LINE_HEIGHT_MM < BOTTOM_MM {
            self.new_page();
        }
    }

    fn emit_line(&mut self, text: &str) {
        self.ensure_space(1.0);
        let truncated: String = text.chars().take(500).collect();
        self.current_layer()
            .use_text(&truncated, FONT_SIZE, Mm(MARGIN_MM), Mm(self.y), self.font);
        self.y -= LINE_HEIGHT_MM;
    }

    fn emit_paragraph_gap(&mut self) {
        self.y -= 2.0;
    }
}

fn load_unicode_font(doc: &PdfDocumentReference) -> Result<IndirectFontRef, String> {
    let bytes = include_bytes!("../../assets/fonts/NotoSans-Regular.ttf");
    let mut reader = Cursor::new(bytes.as_slice());
    doc.add_external_font(&mut reader)
        .map_err(|e| format!("Failed to load PDF font: {e}"))
}

/// Word-wrap a paragraph to lines of at most `max_chars` (by Unicode scalar count).
fn wrap_paragraph(text: &str, max_chars: usize) -> Vec<String> {
    let words: Vec<&str> = text.split_whitespace().collect();
    if words.is_empty() {
        return Vec::new();
    }

    let mut lines: Vec<String> = Vec::new();
    let mut current = words[0].to_string();

    for word in words.iter().skip(1) {
        if current.chars().count() + 1 + word.chars().count() <= max_chars {
            current.push(' ');
            current.push_str(word);
        } else {
            lines.push(current);
            current = (*word).to_string();
        }
    }
    lines.push(current);
    lines
}

pub fn write_pdf(data: &ExportJobData, path: &Path) -> Result<(), String> {
    let (doc, page1, layer1) =
        PdfDocument::new(&data.filename, Mm(PAGE_W), Mm(PAGE_H), "Transcript");
    let font = load_unicode_font(&doc)?;

    let mut writer = PdfWriter {
        doc: &doc,
        page: page1,
        layer: layer1,
        font: &font,
        y: PAGE_H as f64 - MARGIN_MM,
    };

    writer.emit_line(&format!("{} — {}", data.filename, data.created_at));
    writer.emit_paragraph_gap();

    if let Some(ref d) = data.duration {
        writer.emit_line(&format!("Duration: {d}"));
    }
    if let Some(ref m) = data.model_used {
        writer.emit_line(&format!("Model: {m}"));
    }
    if let Some(ref note) = data.translation_note {
        writer.emit_line(note);
    }
    writer.emit_paragraph_gap();

    let body = data.transcript.trim();
    if body.is_empty() {
        writer.emit_line("(empty transcript)");
    } else {
        for paragraph in body.split('\n') {
            let p = paragraph.trim();
            if p.is_empty() {
                continue;
            }
            for line in wrap_paragraph(p, MAX_CHARS_PER_LINE) {
                writer.emit_line(&line);
            }
            writer.emit_paragraph_gap();
        }
    }

    let file = File::create(path).map_err(|e| e.to_string())?;
    let mut out = BufWriter::new(file);
    doc.save(&mut out).map_err(|e| e.to_string())?;
    Ok(())
}

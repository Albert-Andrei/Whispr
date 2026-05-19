use reqwest::Client;
use serde::Deserialize;

#[derive(Deserialize)]
struct LingvaResponse {
    translation: Option<String>,
}

const LINGVA_BASE: &str = "https://lingva.ml/api/v1";
const WORDS_PER_CHUNK: usize = 100;
/// When extending past the word limit, scan at most this many extra words for a break.
const MAX_EXTRA_WORDS: usize = 20;

fn word_starts(text: &str) -> Vec<usize> {
    let mut starts = Vec::new();
    let mut in_word = false;
    for (i, c) in text.char_indices() {
        if c.is_whitespace() {
            in_word = false;
        } else if !in_word {
            starts.push(i);
            in_word = true;
        }
    }
    starts
}

fn end_of_word(text: &str, word_start: usize) -> usize {
    text[word_start..]
        .char_indices()
        .find(|(_, c)| c.is_whitespace())
        .map(|(i, _)| word_start + i)
        .unwrap_or(text.len())
}

/// Prefer paragraph, line, or sentence boundaries within [chunk_end, limit).
fn extend_to_break(text: &str, chunk_end: usize, limit: usize) -> usize {
    if chunk_end >= limit {
        return chunk_end;
    }
    let search = &text[chunk_end..limit];
    if let Some(pos) = search.rfind("\n\n") {
        return chunk_end + pos + 2;
    }
    if let Some(pos) = search.rfind('\n') {
        return chunk_end + pos + 1;
    }
    if let Some(pos) = search.rfind(". ") {
        return chunk_end + pos + 2;
    }
    if let Some(pos) = search.rfind("! ") {
        return chunk_end + pos + 2;
    }
    if let Some(pos) = search.rfind("? ") {
        return chunk_end + pos + 2;
    }
    chunk_end
}

fn chunk_text(text: &str) -> Vec<String> {
    if text.is_empty() {
        return vec![];
    }

    let starts = word_starts(text);
    if starts.is_empty() {
        return vec![text.to_string()];
    }
    if starts.len() <= WORDS_PER_CHUNK {
        return vec![text.to_string()];
    }

    let mut chunks = Vec::new();
    let mut byte_start = 0;
    let mut word_idx = 0;

    while word_idx < starts.len() {
        let target_end_word = (word_idx + WORDS_PER_CHUNK).min(starts.len());
        let mut chunk_end = if target_end_word < starts.len() {
            end_of_word(text, starts[target_end_word - 1])
        } else {
            text.len()
        };

        if target_end_word < starts.len() {
            let extend_word_idx =
                (target_end_word + MAX_EXTRA_WORDS).min(starts.len()).saturating_sub(1);
            let limit = end_of_word(text, starts[extend_word_idx]);
            chunk_end = extend_to_break(text, chunk_end, limit);
        }

        let chunk = text[byte_start..chunk_end].to_string();
        if !chunk.is_empty() {
            chunks.push(chunk);
        }
        if chunk_end <= byte_start {
            // Avoid a stuck loop when boundary logic does not advance.
            byte_start = (byte_start + 1).min(text.len());
        } else {
            byte_start = chunk_end;
        }
        word_idx = starts
            .iter()
            .position(|&s| s >= byte_start)
            .unwrap_or(starts.len());
    }

    chunks
}

#[tauri::command]
pub async fn translate_text(text: String, target_lang: String) -> Result<String, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {e}"))?;

    let chunks = chunk_text(&text);
    if chunks.is_empty() {
        return Ok(String::new());
    }

    let mut result = String::with_capacity(text.len());

    for (i, chunk) in chunks.iter().enumerate() {
        let encoded = urlencoding::encode(chunk);
        let url = format!("{LINGVA_BASE}/auto/{target_lang}/{encoded}");

        let resp = client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Translation request failed (part {}): {e}", i + 1))?;

        if !resp.status().is_success() {
            return Err(format!(
                "Translation API returned status {} (part {})",
                resp.status(),
                i + 1
            ));
        }

        let data: LingvaResponse = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse translation response (part {}): {e}", i + 1))?;

        match data.translation {
            Some(t) => result.push_str(&t),
            None => {
                return Err(format!(
                    "Translation API returned empty result (part {})",
                    i + 1
                ))
            }
        }
    }

    if result.trim().is_empty() && !text.trim().is_empty() {
        return Err("Translation returned empty result".into());
    }

    Ok(result)
}

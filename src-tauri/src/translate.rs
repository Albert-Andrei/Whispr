use reqwest::Client;
use serde::Deserialize;

#[derive(Deserialize)]
struct LingvaResponse {
    translation: Option<String>,
}

const LINGVA_BASE: &str = "https://lingva.ml/api/v1";
const CHUNK_SIZE: usize = 800;

fn chunk_text(text: &str) -> Vec<&str> {
    if text.len() <= CHUNK_SIZE {
        return vec![text];
    }

    let mut chunks: Vec<&str> = Vec::new();
    let mut start = 0;

    while start < text.len() {
        let end = (start + CHUNK_SIZE).min(text.len());

        // Try to split at a paragraph or sentence boundary
        let split_at = if end == text.len() {
            end
        } else if let Some(pos) = text[start..end].rfind("\n\n") {
            start + pos + 2
        } else if let Some(pos) = text[start..end].rfind('\n') {
            start + pos + 1
        } else if let Some(pos) = text[start..end].rfind(". ") {
            start + pos + 2
        } else {
            end
        };

        let chunk = &text[start..split_at];
        if !chunk.is_empty() {
            chunks.push(chunk);
        }
        start = split_at;
    }

    chunks
}

#[tauri::command]
pub async fn translate_text(text: String, target_lang: String) -> Result<String, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {e}"))?;

    let chunks = chunk_text(&text);
    let mut result = String::with_capacity(text.len());

    for chunk in chunks {
        let encoded = urlencoding::encode(chunk);
        let url = format!("{LINGVA_BASE}/auto/{target_lang}/{encoded}");

        let resp = client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Translation request failed: {e}"))?;

        if !resp.status().is_success() {
            return Err(format!("Translation API returned status {}", resp.status()));
        }

        let data: LingvaResponse = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse translation response: {e}"))?;

        match data.translation {
            Some(t) => result.push_str(&t),
            None => return Err("Translation API returned empty result".into()),
        }
    }

    Ok(result)
}

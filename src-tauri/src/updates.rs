use serde::Serialize;

const GITHUB_REPO: &str = "Albert-Andrei/Whispr";

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppUpdateInfo {
    pub current_version: String,
    pub latest_version: Option<String>,
    pub update_available: bool,
    pub release_url: Option<String>,
    pub release_name: Option<String>,
}

fn parse_version(s: &str) -> Option<(u64, u64, u64)> {
    let s = s.trim().trim_start_matches('v');
    let core = s.split('+').next()?.split('-').next()?;
    let mut parts = core.split('.');
    let major = parts.next()?.parse().ok()?;
    let minor = parts.next().unwrap_or("0").parse().ok()?;
    let patch = parts.next().unwrap_or("0").parse().ok()?;
    Some((major, minor, patch))
}

fn is_newer(latest: &str, current: &str) -> bool {
    match (parse_version(latest), parse_version(current)) {
        (Some(l), Some(c)) => l > c,
        _ => false,
    }
}

#[tauri::command]
pub async fn check_for_update() -> Result<AppUpdateInfo, String> {
    let current = env!("CARGO_PKG_VERSION").to_string();

    let client = reqwest::Client::builder()
        .user_agent("Whispr")
        .build()
        .map_err(|e| e.to_string())?;

    let url = format!("https://api.github.com/repos/{GITHUB_REPO}/releases/latest");
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if resp.status() == 404 {
        return Ok(AppUpdateInfo {
            current_version: current,
            latest_version: None,
            update_available: false,
            release_url: Some(format!("https://github.com/{GITHUB_REPO}/releases")),
            release_name: None,
        });
    }

    if !resp.status().is_success() {
        return Err(format!("Could not check for updates (HTTP {})", resp.status()));
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let tag = json
        .get("tag_name")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let html_url = json
        .get("html_url")
        .and_then(|v| v.as_str())
        .map(String::from);
    let name = json
        .get("name")
        .and_then(|v| v.as_str())
        .map(String::from);

    let latest_display = tag.trim_start_matches('v').to_string();
    let update_available = !tag.is_empty() && is_newer(&tag, &current);

    Ok(AppUpdateInfo {
        current_version: current,
        latest_version: if tag.is_empty() {
            None
        } else {
            Some(latest_display)
        },
        update_available,
        release_url: html_url,
        release_name: name,
    })
}

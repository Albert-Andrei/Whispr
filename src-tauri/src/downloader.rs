use crate::paths;
use futures_util::StreamExt;
use serde::Serialize;
use std::fs::File;
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetupProgressPayload {
    pub component: String,
    pub downloaded: u64,
    pub total: Option<u64>,
}

fn emit_setup(app: &AppHandle, component: &str, downloaded: u64, total: Option<u64>) {
    let _ = app.emit(
        "setup:progress",
        SetupProgressPayload {
            component: component.to_string(),
            downloaded,
            total,
        },
    );
}

/// True if path exists, is a file, and is non-empty (handles missing / broken symlinks).
fn bin_tool_usable(path: &Path) -> bool {
    std::fs::metadata(path)
        .map(|m| m.is_file() && m.len() > 0)
        .unwrap_or(false)
}

async fn download_to_path(
    app: &AppHandle,
    component: &str,
    url: &str,
    dest: &Path,
    emit_progress: bool,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let res = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("{component} download failed: {e}"))?;
    if !res.status().is_success() {
        return Err(format!(
            "{component} download HTTP {}",
            res.status()
        ));
    }
    let total = res.content_length();
    let mut stream = res.bytes_stream();
    let mut file = File::create(dest).map_err(|e| e.to_string())?;
    let mut done: u64 = 0;
    if emit_progress {
        emit_setup(app, component, 0, total);
    }
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        done += chunk.len() as u64;
        if emit_progress {
            emit_setup(app, component, done, total);
        }
    }
    Ok(())
}

#[cfg(unix)]
fn chmod755(path: &Path) {
    use std::os::unix::fs::PermissionsExt;
    let _ = std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o755));
}

#[cfg(not(unix))]
fn chmod755(_path: &Path) {}

async fn ensure_ffmpeg_downloaded(app: &AppHandle, emit_progress: bool) -> Result<(), String> {
    let dest = paths::ffmpeg_path(app)?;
    if bin_tool_usable(&dest) {
        return Ok(());
    }
    let _ = std::fs::remove_file(&dest);
    let url = ffmpeg_url()?;
    download_to_path(app, "ffmpeg", url, &dest, emit_progress).await?;
    chmod755(&dest);
    Ok(())
}

async fn ensure_ytdlp_downloaded(app: &AppHandle, emit_progress: bool) -> Result<(), String> {
    let dest = paths::ytdlp_path(app)?;
    if bin_tool_usable(&dest) {
        return Ok(());
    }
    let _ = std::fs::remove_file(&dest);
    download_to_path(app, "yt-dlp", ytdlp_url(), &dest, emit_progress).await?;
    chmod755(&dest);
    Ok(())
}

fn ffmpeg_url() -> Result<&'static str, String> {
    if cfg!(target_os = "macos") {
        if cfg!(target_arch = "aarch64") {
            return Ok("https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-arm64");
        }
        if cfg!(target_arch = "x86_64") {
            return Ok("https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-x64");
        }
    }
    Err("Unsupported platform for automatic ffmpeg download".to_string())
}

fn ytdlp_url() -> &'static str {
    if cfg!(target_os = "macos") {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
    } else {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
    }
}

#[tauri::command]
pub async fn download_tools(app: AppHandle) -> Result<(), String> {
    paths::ensure_layout(&app)?;
    ensure_ffmpeg_downloaded(&app, true).await?;
    ensure_ytdlp_downloaded(&app, true).await?;
    install_whisper_cli(&app)?;
    Ok(())
}

/// Re-download ffmpeg / yt-dlp into `bin/` when missing, empty, or broken. No `setup:progress` (quiet repair).
pub async fn ensure_bin_tools_at_launch(app: &AppHandle) -> Result<(), String> {
    paths::ensure_layout(app)?;
    ensure_ffmpeg_downloaded(app, false).await?;
    ensure_ytdlp_downloaded(app, false).await?;
    Ok(())
}

#[cfg(target_os = "macos")]
fn brew_exe_path() -> Option<PathBuf> {
    ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"]
        .into_iter()
        .map(PathBuf::from)
        .find(|p| p.is_file())
}

/// Install the `whisper-cpp` formula if needed (idempotent). Requires Homebrew on Apple Silicon or Intel Mac paths.
#[cfg(target_os = "macos")]
fn try_brew_install_whisper_cpp() -> Result<(), String> {
    let Some(brew) = brew_exe_path() else {
        return Err(
            "Homebrew was not found. Install it from https://brew.sh , then try again.".into(),
        );
    };
    eprintln!(
        "Whispr: running `brew install whisper-cpp` (first install may take several minutes)…"
    );
    let output = std::process::Command::new(&brew)
        .args(["install", "whisper-cpp"])
        .env("HOMEBREW_NO_AUTO_UPDATE", "1")
        .env("HOMEBREW_NO_INSTALL_CLEANUP", "1")
        .env("HOMEBREW_NO_ENV_HINTS", "1")
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to run Homebrew: {e}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let tail: String = stderr.chars().take(1200).collect();
        return Err(format!(
            "Homebrew could not install whisper-cpp.\n{tail}"
        ));
    }
    eprintln!("Whispr: whisper-cpp is ready.");
    Ok(())
}

#[cfg(target_os = "macos")]
fn brewed_whisper_cli_prefix(brew_exe: &str) -> Option<PathBuf> {
    use std::path::Path;
    let out = std::process::Command::new(brew_exe)
        .args(["--prefix", "whisper-cpp"])
        .output()
        .ok()
        .filter(|o| o.status.success())?;
    let pref = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if pref.is_empty() {
        return None;
    }
    let p = Path::new(&pref).join("bin").join("whisper-cli");
    p.is_file().then_some(p)
}

#[cfg(target_os = "macos")]
fn find_system_whisper_cli() -> Option<PathBuf> {
    use std::path::Path;

    let mut candidates: Vec<PathBuf> = vec![
        PathBuf::from("/opt/homebrew/bin/whisper-cli"),
        PathBuf::from("/usr/local/bin/whisper-cli"),
        PathBuf::from("/opt/homebrew/opt/whisper-cpp/bin/whisper-cli"),
        PathBuf::from("/usr/local/opt/whisper-cpp/bin/whisper-cli"),
    ];
    for brew in ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"] {
        if let Some(p) = brewed_whisper_cli_prefix(brew) {
            candidates.push(p);
        }
    }
    let path_boost = "/opt/homebrew/bin:/usr/local/bin:/opt/homebrew/sbin:/usr/local/sbin";
    let path_var = std::env::var("PATH").unwrap_or_default();
    let merged = format!("{path_boost}:{path_var}");
    for part in merged.split(':') {
        if part.is_empty() {
            continue;
        }
        candidates.push(Path::new(part).join("whisper-cli"));
    }

    candidates.into_iter().find(|p| p.is_file())
}

const WHISPER_CLI_SETUP_ERR: &str = "Whisper CLI still could not be set up.\n\n\
- If you do not use Homebrew, install it from https://brew.sh and try again (Whispr installs whisper-cpp for you).\n\
- Or build/install whisper-cli yourself so it lives under /opt/homebrew/bin, /usr/local/bin, or on your PATH.";

/// `Ok(Some(()))` linked, `Ok(None)` whisper-cli still not found, `Err` Homebrew / symlink failure.
#[cfg(target_os = "macos")]
fn try_symlink_whisper_cli(app: &AppHandle, emit_progress: bool) -> Result<Option<()>, String> {
    use std::os::unix::fs::symlink;
    if emit_progress {
        emit_setup(app, "whisper-cli", 0, Some(1));
    }
    let dest = paths::whisper_cli_path(app)?;
    let _ = std::fs::remove_file(&dest);

    let mut src = find_system_whisper_cli();
    if src.is_none() {
        try_brew_install_whisper_cpp()?;
        src = find_system_whisper_cli();
    }

    let Some(src) = src else {
        if emit_progress {
            emit_setup(app, "whisper-cli", 0, Some(1));
        }
        return Ok(None);
    };

    symlink(&src, &dest).map_err(|e| format!("whisper-cli symlink: {e}"))?;
    if emit_progress {
        emit_setup(app, "whisper-cli", 1, Some(1));
    }
    Ok(Some(()))
}

#[cfg(target_os = "macos")]
fn install_whisper_cli(app: &AppHandle) -> Result<(), String> {
    match try_symlink_whisper_cli(app, true)? {
        Some(()) => Ok(()),
        None => Err(WHISPER_CLI_SETUP_ERR.into()),
    }
}

#[cfg(not(target_os = "macos"))]
fn install_whisper_cli(_app: &AppHandle) -> Result<(), String> {
    Err("Automatic Whisper setup is only wired for macOS. Install whisper-cli manually into the app bin directory.".into())
}

/// Re-link `bin/whisper-cli` on every launch if it is missing or broken but the binary exists on the system.
#[cfg(target_os = "macos")]
pub fn ensure_whisper_cli_linked(app: &AppHandle) {
    if paths::ensure_layout(app).is_err() {
        return;
    }
    let Ok(dest) = paths::whisper_cli_path(app) else {
        return;
    };
    if std::fs::metadata(&dest).map(|m| m.is_file()).unwrap_or(false) {
        return;
    }
    let _ = std::fs::remove_file(&dest);
    match try_symlink_whisper_cli(app, false) {
        Ok(Some(())) => {}
        Ok(None) => eprintln!(
            "Whispr: whisper-cli is still missing after Homebrew install; open the app again or run setup."
        ),
        Err(e) => eprintln!("Whispr: could not set up whisper-cli: {e}"),
    }
}

#[cfg(not(target_os = "macos"))]
pub fn ensure_whisper_cli_linked(_app: &AppHandle) {}

pub fn model_hf_name(tier: &str) -> Result<&'static str, String> {
    match tier {
        "small" => Ok("ggml-small.bin"),
        "medium" => Ok("ggml-medium.bin"),
        "large" => Ok("ggml-large-v3.bin"),
        _ => Err(format!("Unknown model tier: {tier}")),
    }
}

fn model_url(filename: &str) -> String {
    format!("https://huggingface.co/ggerganov/whisper.cpp/resolve/main/{filename}")
}

/// `tier`: `small` | `medium` | `large`
#[tauri::command]
pub async fn download_model_file(app: AppHandle, tier: String) -> Result<(), String> {
    paths::ensure_layout(&app)?;
    let name = model_hf_name(&tier)?;
    let dest: PathBuf = paths::models_dir(&app)?.join(name);
    let url = model_url(name);
    download_to_path(&app, &format!("model:{name}"), &url, &dest, true).await?;
    Ok(())
}

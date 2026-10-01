//! Installs the bundled tools (ffmpeg, whisper-cli, and the yt-dlp package)
//! from the app bundle into the app's own `bin/` directory.
//!
//! Why copy instead of running them in place: every file inside a DMG the user
//! downloaded carries the `com.apple.quarantine` attribute. Whispr is not
//! notarized, and on current macOS the kernel refuses to execute quarantined
//! binaries that are not notarized, even when the app itself was allowed to
//! open. A fresh copy written by the app has no quarantine flag, and `bin/` is
//! exactly where earlier versions ran the downloaded tools from without issue.

use crate::paths;
use std::fs::{self, File};
use std::io;
use std::path::Path;
use tauri::AppHandle;

const STAMP_FILE: &str = ".tools-version";

fn app_version(app: &AppHandle) -> String {
    app.package_info().version.to_string()
}

/// True when `dest` is missing, is a symlink (legacy Homebrew link), or does
/// not match the bundled file's size.
fn needs_install(src: &Path, dest: &Path) -> bool {
    let src_len = fs::metadata(src).map(|m| m.len()).unwrap_or(0);
    match fs::symlink_metadata(dest) {
        Err(_) => true,
        Ok(m) => {
            m.file_type().is_symlink() || !m.is_file() || m.len() == 0 || m.len() != src_len
        }
    }
}

#[cfg(unix)]
fn chmod755(path: &Path) -> io::Result<()> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o755))
}

#[cfg(not(unix))]
fn chmod755(_path: &Path) -> io::Result<()> {
    Ok(())
}

/// Best effort: make sure no quarantine flag survives on the installed copy
/// (recursive, so it also covers the yt-dlp package directory).
#[cfg(target_os = "macos")]
fn strip_quarantine(path: &Path) {
    let _ = std::process::Command::new("/usr/bin/xattr")
        .args(["-dr", "com.apple.quarantine"])
        .arg(path)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status();
}

#[cfg(not(target_os = "macos"))]
fn strip_quarantine(_path: &Path) {}

/// Copy `src` to `dest` by streaming bytes (not `fs::copy`, which on macOS
/// clones the file including its extended attributes). Writes to a temp file
/// first so a crash mid-copy never leaves a truncated tool in place.
fn copy_fresh(src: &Path, dest: &Path) -> Result<(), String> {
    let file_name = dest
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "invalid tool path".to_string())?;
    let tmp = dest.with_file_name(format!(".{file_name}.tmp"));
    let _ = fs::remove_file(&tmp);

    {
        let mut reader = File::open(src).map_err(|e| format!("open {}: {e}", src.display()))?;
        let mut writer = File::create(&tmp).map_err(|e| format!("create {}: {e}", tmp.display()))?;
        io::copy(&mut reader, &mut writer).map_err(|e| format!("copy: {e}"))?;
        writer.sync_all().map_err(|e| format!("sync: {e}"))?;
    }

    chmod755(&tmp).map_err(|e| format!("chmod: {e}"))?;
    let _ = fs::remove_file(dest);
    fs::rename(&tmp, dest).map_err(|e| format!("rename into place: {e}"))?;
    strip_quarantine(dest);
    Ok(())
}

/// Recursively copy a directory tree, streaming each file like [`copy_fresh`].
/// Symlinks are recreated as symlinks (the Python framework inside the yt-dlp
/// package relies on them).
fn copy_tree(src: &Path, dest: &Path) -> Result<(), String> {
    fs::create_dir_all(dest).map_err(|e| format!("mkdir {}: {e}", dest.display()))?;
    for entry in fs::read_dir(src).map_err(|e| format!("read {}: {e}", src.display()))? {
        let entry = entry.map_err(|e| e.to_string())?;
        let from = entry.path();
        let to = dest.join(entry.file_name());
        let meta = fs::symlink_metadata(&from).map_err(|e| e.to_string())?;
        if meta.file_type().is_symlink() {
            let target = fs::read_link(&from).map_err(|e| e.to_string())?;
            #[cfg(unix)]
            std::os::unix::fs::symlink(&target, &to).map_err(|e| format!("symlink {}: {e}", to.display()))?;
        } else if meta.is_dir() {
            copy_tree(&from, &to)?;
        } else {
            let mut reader = File::open(&from).map_err(|e| format!("open {}: {e}", from.display()))?;
            let mut writer = File::create(&to).map_err(|e| format!("create {}: {e}", to.display()))?;
            io::copy(&mut reader, &mut writer).map_err(|e| format!("copy {}: {e}", from.display()))?;
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let _ = fs::set_permissions(&to, fs::Permissions::from_mode(meta.permissions().mode() & 0o777));
            }
        }
    }
    Ok(())
}

/// Install the yt-dlp package directory into `bin/yt-dlp/`, building it in a
/// temp directory first and swapping it into place when complete.
fn install_ytdlp_package(src_dir: &Path, dest_dir: &Path) -> Result<(), String> {
    let tmp = dest_dir.with_file_name(".yt-dlp.tmp");
    let _ = fs::remove_dir_all(&tmp);
    copy_tree(src_dir, &tmp)?;
    chmod755(&tmp.join("yt-dlp")).map_err(|e| format!("chmod launcher: {e}"))?;
    let _ = fs::remove_dir_all(dest_dir);
    // Legacy single-file yt-dlp from older versions sits at the same path.
    let _ = fs::remove_file(dest_dir);
    fs::rename(&tmp, dest_dir).map_err(|e| format!("rename into place: {e}"))?;
    strip_quarantine(dest_dir);
    Ok(())
}

/// Ensure every bundled tool has an up-to-date, runnable copy in `bin/`.
///
/// Idempotent and cheap when nothing changed. All tools are re-copied after an
/// app update (tracked with a version stamp), or individually when a copy is
/// missing, empty, a symlink, or differs in size from the bundled file.
/// Returns the names of the tools that were (re)installed.
pub fn install_bundled_tools(app: &AppHandle) -> Result<Vec<String>, String> {
    paths::ensure_layout(app)?;
    let version = app_version(app);
    let stamp = paths::bin_dir(app)?.join(STAMP_FILE);
    let stamped = fs::read_to_string(&stamp)
        .ok()
        .map(|s| s.trim().to_string());
    let force = stamped.as_deref() != Some(version.as_str());

    let mut installed = Vec::new();
    let mut errors = Vec::new();

    for name in paths::TOOL_NAMES {
        let src = paths::bundled_tool_path(name)?;
        let dest = paths::tool_path(app, name)?;
        if !src.is_file() {
            errors.push(format!(
                "{name}: bundled binary not found at {}",
                src.display()
            ));
            continue;
        }
        if force || needs_install(&src, &dest) {
            match copy_fresh(&src, &dest) {
                Ok(()) => installed.push(name.to_string()),
                Err(e) => errors.push(format!("{name}: {e}")),
            }
        }
    }

    // yt-dlp: a directory package rather than a single file. Reinstalled on
    // app update or when its launcher is missing.
    match paths::bundled_ytdlp_dir(app) {
        Ok(src_dir) if src_dir.join("yt-dlp").is_file() => {
            let dest_dir = paths::ytdlp_dir(app)?;
            let launcher_missing = !dest_dir.join("yt-dlp").is_file();
            if force || launcher_missing {
                match install_ytdlp_package(&src_dir, &dest_dir) {
                    Ok(()) => installed.push("yt-dlp".to_string()),
                    Err(e) => errors.push(format!("yt-dlp: {e}")),
                }
            }
        }
        Ok(src_dir) => errors.push(format!(
            "yt-dlp: bundled package not found at {}",
            src_dir.display()
        )),
        Err(e) => errors.push(format!("yt-dlp: {e}")),
    }

    if !errors.is_empty() {
        return Err(errors.join("\n"));
    }
    let _ = fs::write(&stamp, &version);
    Ok(installed)
}

/// Frontend entry point: same as [`install_bundled_tools`], off the main thread.
#[tauri::command]
pub async fn ensure_tools(app: AppHandle) -> Result<Vec<String>, String> {
    tokio::task::spawn_blocking(move || install_bundled_tools(&app))
        .await
        .map_err(|e| e.to_string())?
}

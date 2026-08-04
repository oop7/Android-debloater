#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};

#[cfg(windows)]
const ADB_FILENAME: &str = "adb.exe";
#[cfg(not(windows))]
const ADB_FILENAME: &str = "adb";

fn resolve_adb_path(app: &tauri::AppHandle) -> Result<String, String> {
  let mut tried: Vec<PathBuf> = Vec::new();

  // 1) Bundled resource (portable across installers)
  if let Some(p) = app
    .path_resolver()
    .resolve_resource(format!("platform-tools/{}", ADB_FILENAME))
  {
    if p.exists() {
      return Ok(p.to_string_lossy().to_string());
    } else {
      tried.push(p);
    }
  }

  // 2) Next to exe: resources/platform-tools
  if let Ok(exe) = std::env::current_exe() {
    if let Some(dir) = exe.parent() {
      let cand = dir.join("resources").join("platform-tools").join(ADB_FILENAME);
      if cand.exists() { return Ok(cand.to_string_lossy().to_string()); }
      tried.push(cand);

      // 3) Some installers place resources under "_up_"
      let cand2 = dir.join("_up_").join("platform-tools").join(ADB_FILENAME);
      if cand2.exists() { return Ok(cand2.to_string_lossy().to_string()); }
      tried.push(cand2);
    }
  }

  Err(format!(
    "ADB not found in built-in locations. Tried: {}",
    tried
      .iter()
      .map(|p| p.to_string_lossy().to_string())
      .collect::<Vec<_>>()
      .join(", ")
  ))
}

// Ensure adb runs without flashing a console window on Windows
#[cfg(windows)]
fn make_cmd(cmd: std::process::Command) -> std::process::Command {
  use std::os::windows::process::CommandExt;
  const CREATE_NO_WINDOW: u32 = 0x08000000;
  let mut c = cmd;
  c.creation_flags(CREATE_NO_WINDOW);
  c
}

#[cfg(not(windows))]
fn make_cmd(cmd: std::process::Command) -> std::process::Command { cmd }

#[derive(Serialize, Deserialize)]
struct DeviceInfo {
  id: String,
  status: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct PackageInfo {
  pub package: String,
  pub name: String,
}

fn backup_apk(app: &tauri::AppHandle, package: &str) -> Result<PathBuf, String> {
  let adb = resolve_adb_path(app)?;

  // Query APK paths for the package
  let output = make_cmd(Command::new(&adb))
    .args(["shell", "pm", "path", package])
    .stdout(Stdio::piped())
    .output()
    .map_err(|e| format!("Failed to run adb ({}): {}", adb, e))?;
  if !output.status.success() {
    return Err(format!(
      "Failed to get APK paths for {}: {}",
      package,
      String::from_utf8_lossy(&output.stderr)
    ));
  }
  let stdout = String::from_utf8_lossy(&output.stdout);
  let mut apk_paths: Vec<String> = Vec::new();
  for line in stdout.lines() {
    if let Some((_, path)) = line.split_once(":") {
      let p = path.trim();
      if !p.is_empty() { apk_paths.push(p.to_string()); }
    }
  }
  if apk_paths.is_empty() {
    return Err(format!("No APK paths found for {}", package));
  }

  // Destination: Documents/AndroidDebloater/backups/<package>-<ts>/
  let base = dirs::document_dir()
    .or_else(|| dirs::home_dir())
    .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
  let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
  let dest_dir = base
    .join("AndroidDebloater")
    .join("backups")
    .join(format!("{}-{}", package, ts));
  fs::create_dir_all(&dest_dir).map_err(|e| format!("Failed to create backup dir: {}", e))?;

  // Pull APK(s)
  for rp in &apk_paths {
    let status = make_cmd(Command::new(&adb))
      .args(["pull", rp, dest_dir.to_string_lossy().as_ref()])
      .stdout(Stdio::null())
      .stderr(Stdio::piped())
      .status()
      .map_err(|e| format!("Failed to run adb pull ({}): {}", adb, e))?;
    if !status.success() {
      return Err(format!("adb pull failed for {} -> {}", rp, dest_dir.to_string_lossy()));
    }
  }

  Ok(dest_dir)
}

#[derive(Serialize, Deserialize, Clone)]
struct BackupEntry {
  package: String,
  dir: String,
  timestamp: u64,
}

fn backups_root() -> PathBuf {
  let base = dirs::document_dir()
    .or_else(|| dirs::home_dir())
    .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
  base.join("AndroidDebloater").join("backups")
}

#[tauri::command]
fn get_backups_latest() -> Result<Vec<BackupEntry>, String> {
  let root = backups_root();
  if !root.exists() {
    return Ok(vec![]);
  }
  let mut latest_by_pkg: std::collections::HashMap<String, BackupEntry> = std::collections::HashMap::new();
  for entry in fs::read_dir(&root).map_err(|e| format!("Failed to read backups root: {}", e))? {
    let entry = entry.map_err(|e| format!("Dir entry error: {}", e))?;
    let path = entry.path();
    if !path.is_dir() { continue; }
    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
      // Expect pattern: <package>-<timestamp>
      if let Some(idx) = name.rfind('-') {
        let pkg = (&name[..idx]).to_string();
        let ts_str = &name[idx+1..];
        let ts = ts_str.parse::<u64>().unwrap_or(0);
        let be = BackupEntry { package: pkg.clone(), dir: path.to_string_lossy().to_string(), timestamp: ts };
        latest_by_pkg
          .entry(pkg)
          .and_modify(|e| { if ts > e.timestamp { *e = be.clone(); }})
          .or_insert(be);
      }
    }
  }
  let mut list: Vec<BackupEntry> = latest_by_pkg.into_values().collect();
  list.sort_by(|a,b| a.package.cmp(&b.package));
  Ok(list)
}

#[tauri::command]
fn list_devices(app: tauri::AppHandle) -> Result<Vec<DeviceInfo>, String> {
  let adb = resolve_adb_path(&app)?;
  let output = make_cmd(Command::new(&adb))
    .arg("devices")
    .stdout(Stdio::piped())
    .output()
    .map_err(|e| format!("Failed to run adb ({}): {}", adb, e))?;
  let stdout = String::from_utf8_lossy(&output.stdout);
  let mut devices = Vec::new();
  for (i, line) in stdout.lines().enumerate() {
    if i == 0 { continue; }
    if line.trim().is_empty() { continue; }
    if let Some((id, status)) = line.split_once('\t') {
      devices.push(DeviceInfo { id: id.to_string(), status: status.to_string() });
    }
  }
  Ok(devices)
}

fn get_known_package_name(pkg: &str) -> Option<&'static str> {
  match pkg {
    "com.google.android.marvin.talkback" => Some("Android Accessibility Suite"),
    "com.google.android.accessibility.soundamplifier" => Some("Sound Amplifier"),
    "com.google.audio.hearing.visualization.accessibility.scribe" => Some("Live Transcribe"),
    "com.google.android.apps.accessibility.voiceaccess" => Some("Voice Access"),
    "com.android.chrome" => Some("Google Chrome"),
    "com.google.android.youtube" => Some("YouTube"),
    "com.google.android.apps.youtube.music" => Some("YouTube Music"),
    "com.google.android.gms" => Some("Google Play Services"),
    "com.google.android.vending" => Some("Google Play Store"),
    "com.google.android.googlequicksearchbox" => Some("Google App"),
    "com.google.android.apps.maps" => Some("Google Maps"),
    "com.google.android.gm" => Some("Gmail"),
    "com.google.android.apps.docs" => Some("Google Drive"),
    "com.google.android.apps.photos" => Some("Google Photos"),
    "com.google.android.calendar" => Some("Google Calendar"),
    "com.google.android.contacts" => Some("Google Contacts"),
    "com.google.android.deskclock" => Some("Google Clock"),
    "com.google.android.apps.messaging" => Some("Google Messages"),
    "com.google.android.dialer" => Some("Phone by Google"),
    "com.google.android.inputmethod.latin" => Some("Gboard"),
    "com.google.android.keep" => Some("Google Keep"),
    "com.google.android.videos" => Some("Google TV"),
    "com.google.android.apps.tachyon" => Some("Google Meet"),
    "com.google.android.apps.walletnfcrel" => Some("Google Wallet"),
    "com.google.android.tts" => Some("Speech Recognition & Synthesis"),
    "com.google.android.apps.nbu.files" => Some("Files by Google"),
    "com.google.android.calculator" => Some("Google Calculator"),
    "com.android.settings" => Some("Settings"),
    "com.android.camera" => Some("Camera"),
    "com.android.phone" => Some("Phone"),
    "com.android.dialer" => Some("Dialer"),
    "com.android.contacts" => Some("Contacts"),
    "com.android.mms" => Some("Messaging"),
    "com.android.calculator2" => Some("Calculator"),
    "com.android.deskclock" => Some("Clock"),
    "com.android.gallery3d" => Some("Gallery"),
    "com.android.bluetooth" => Some("Bluetooth"),
    "com.android.stk" => Some("SIM Toolkit"),
    "com.android.providers.downloads.ui" => Some("Downloads"),
    "com.android.printspooler" => Some("Print Spooler"),
    "com.sec.android.app.sbrowser" => Some("Samsung Internet"),
    "com.sec.android.app.popupcalculator" => Some("Samsung Calculator"),
    "com.sec.android.app.clockpackage" => Some("Samsung Clock"),
    "com.sec.android.app.voicenote" => Some("Samsung Voice Recorder"),
    "com.sec.android.gallery3d" => Some("Samsung Gallery"),
    "com.sec.android.app.myfiles" => Some("Samsung My Files"),
    "com.samsung.android.bixby.agent" => Some("Bixby Voice"),
    "com.samsung.android.bixby.wakeup" => Some("Bixby Wakeup"),
    "com.samsung.android.app.spage" => Some("Samsung Free"),
    "com.samsung.android.game.gamehome" => Some("Gaming Hub"),
    "com.samsung.android.app.notes" => Some("Samsung Notes"),
    "com.samsung.android.email.provider" => Some("Samsung Email"),
    "com.samsung.android.calendar" => Some("Samsung Calendar"),
    "com.samsung.android.messaging" => Some("Samsung Messages"),
    "com.samsung.android.pay" => Some("Samsung Pay"),
    "com.samsung.android.health" => Some("Samsung Health"),
    "com.samsung.android.wearable.app" => Some("Galaxy Wearable"),
    "com.miui.securitycenter" => Some("Xiaomi Security"),
    "com.miui.calculator" => Some("Mi Calculator"),
    "com.miui.gallery" => Some("Mi Gallery"),
    "com.miui.player" => Some("Mi Music"),
    "com.miui.videoplayer" => Some("Mi Video"),
    "com.miui.cleanmaster" => Some("Cleaner"),
    "com.miui.weather2" => Some("Mi Weather"),
    "com.miui.notes" => Some("Mi Notes"),
    "com.mi.android.globalminstore" => Some("GetApps"),
    "com.xiaomi.midrop" => Some("ShareMe"),
    "com.facebook.katana" => Some("Facebook"),
    "com.facebook.system" => Some("Facebook App Installer"),
    "com.facebook.appmanager" => Some("Facebook App Manager"),
    "com.facebook.services" => Some("Facebook Services"),
    "com.instagram.android" => Some("Instagram"),
    "com.whatsapp" => Some("WhatsApp"),
    "com.twitter.android" => Some("X (Twitter)"),
    "com.zhiliaoapp.musically" => Some("TikTok"),
    "com.ss.android.ugc.trill" => Some("TikTok"),
    "com.netflix.mediaclient" => Some("Netflix"),
    "com.spotify.music" => Some("Spotify"),
    "com.amazon.mShop.android.shopping" => Some("Amazon Shopping"),
    "com.amazon.mp3" => Some("Amazon Music"),
    "com.amazon.kindle" => Some("Amazon Kindle"),
    "com.microsoft.office.outlook" => Some("Microsoft Outlook"),
    "com.microsoft.office.onedrive" => Some("Microsoft OneDrive"),
    "com.microsoft.skydrive" => Some("OneDrive"),
    "com.microsoft.office.officehubrow" => Some("Microsoft 365"),
    _ => None,
  }
}

fn humanize_package_name(pkg: &str) -> String {
  let parts: Vec<&str> = pkg.split('.').filter(|s| !s.is_empty()).collect();
  if parts.is_empty() {
    return pkg.to_string();
  }

  let ignore_prefixes = [
    "com", "org", "net", "io", "gov", "edu", "android", "sec", "samsung", "miui", "google",
  ];
  let meaningful: Vec<&str> = parts
    .iter()
    .copied()
    .filter(|p| !ignore_prefixes.contains(&p.to_lowercase().as_str()))
    .collect();

  let selected = if meaningful.is_empty() { parts } else { meaningful };

  let mut words = Vec::new();
  for seg in selected {
    let mut current_word = String::new();
    for ch in seg.chars() {
      if ch == '_' || ch == '-' || ch == '.' {
        if !current_word.is_empty() {
          words.push(current_word);
          current_word = String::new();
        }
      } else if ch.is_uppercase() && !current_word.is_empty() {
        words.push(current_word);
        current_word = String::new();
        current_word.push(ch);
      } else {
        current_word.push(ch);
      }
    }
    if !current_word.is_empty() {
      words.push(current_word);
    }
  }

  words
    .into_iter()
    .map(|w| {
      let mut chars = w.chars();
      match chars.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + chars.as_str().to_lowercase().as_str(),
      }
    })
    .collect::<Vec<String>>()
    .join(" ")
}

fn get_adb_labels(app: &tauri::AppHandle) -> std::collections::HashMap<String, String> {
  let mut labels = std::collections::HashMap::new();
  let Ok(adb) = resolve_adb_path(app) else { return labels; };
  let Ok(output) = make_cmd(Command::new(&adb))
    .args(["shell", "dumpsys", "package"])
    .stdout(Stdio::piped())
    .output() else { return labels; };

  let stdout = String::from_utf8_lossy(&output.stdout);
  let mut current_pkg: Option<String> = None;

  for line in stdout.lines() {
    let trimmed = line.trim();
    if trimmed.starts_with("Package [") {
      if let Some(end) = trimmed.find(']') {
        current_pkg = Some(trimmed[9..end].to_string());
      }
    } else if let Some(pkg) = &current_pkg {
      if trimmed.starts_with("application-label:") || trimmed.starts_with("application-label-en:") {
        if let Some(first_quote) = trimmed.find('\'') {
          if let Some(last_quote) = trimmed.rfind('\'') {
            if last_quote > first_quote {
              let label = &trimmed[first_quote + 1..last_quote];
              if !label.is_empty() {
                labels.insert(pkg.clone(), label.to_string());
              }
            }
          }
        }
      }
    }
  }
  labels
}

#[tauri::command]
fn list_packages(app: tauri::AppHandle) -> Result<Vec<PackageInfo>, String> {
  let adb = resolve_adb_path(&app)?;
  let output = make_cmd(Command::new(&adb))
    .args(["shell", "pm", "list", "packages"])
    .stdout(Stdio::piped())
    .output()
    .map_err(|e| format!("Failed to run adb ({}): {}", adb, e))?;
  let stdout = String::from_utf8_lossy(&output.stdout);
  let mut raw_pkgs = Vec::new();
  for line in stdout.lines() {
    if let Some((_, name)) = line.split_once(":") {
      raw_pkgs.push(name.trim().to_string());
    }
  }

  let adb_labels = get_adb_labels(&app);

  let mut pkgs = Vec::new();
  for pkg in raw_pkgs {
    let name = if let Some(known) = get_known_package_name(&pkg) {
      known.to_string()
    } else if let Some(adb_label) = adb_labels.get(&pkg) {
      adb_label.clone()
    } else {
      humanize_package_name(&pkg)
    };
    pkgs.push(PackageInfo { package: pkg, name });
  }

  pkgs.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
  Ok(pkgs)
}

#[tauri::command]
fn uninstall_package(app: tauri::AppHandle, package: String) -> Result<String, String> {
  if package.trim().is_empty() {
    return Err("Package name cannot be empty".into());
  }
  // Backup before uninstall
  let backup_dir = backup_apk(&app, &package)?;

  let adb = resolve_adb_path(&app)?;
  let output = make_cmd(Command::new(&adb))
    .args(["shell", "pm", "uninstall", "--user", "0", &package])
    .stdout(Stdio::piped())
    .output()
    .map_err(|e| format!("Failed to run adb ({}): {}", adb, e))?;
  let stdout = String::from_utf8_lossy(&output.stdout).to_string();
  Ok(format!("Backup saved to: {}\n{}", backup_dir.to_string_lossy(), stdout))
}

#[tauri::command]
fn reboot_device(app: tauri::AppHandle) -> Result<(), String> {
  let adb = resolve_adb_path(&app)?;
  make_cmd(Command::new(&adb))
    .arg("reboot")
    .stdout(Stdio::null())
    .stderr(Stdio::piped())
    .status()
    .map_err(|e| format!("Failed to run adb ({}): {}", adb, e))
    .and_then(|st| if st.success() { Ok(()) } else { Err("adb reboot failed".into()) })
}

#[derive(Serialize)]
struct UpdateInfo {
  latest: String,
  outdated: bool,
}

#[tauri::command]
fn check_update(current: String) -> Result<UpdateInfo, String> {
  // Basic network fetch of GitHub latest release via redirect
  let client = reqwest::blocking::Client::new();
  let resp = client
    .get("https://github.com/oop7/Android-debloater/releases/latest")
    .send()
    .map_err(|e| format!("Request failed: {}", e))?;
  let final_url = resp.url().clone();
  let mut latest = final_url
    .path_segments()
    .and_then(|mut s| s.next_back())
    .unwrap_or("")
    .to_string();
  if latest.starts_with('v') { latest = latest[1..].to_string(); }
  let outdated = semver::Version::parse(&latest)
    .ok()
    .zip(semver::Version::parse(&current).ok())
    .map(|(l, c)| l > c)
    .unwrap_or(false);
  Ok(UpdateInfo { latest, outdated })
}

#[tauri::command]
fn restore_from_backup(app: tauri::AppHandle, dir: String) -> Result<String, String> {
  let adb = resolve_adb_path(&app)?;
  let p = PathBuf::from(&dir);
  if !p.exists() || !p.is_dir() {
    return Err(format!("Backup path is not a directory: {}", dir));
  }

  // Collect .apk files (non-recursive)
  let mut apks: Vec<PathBuf> = Vec::new();
  for entry in fs::read_dir(&p).map_err(|e| format!("Failed to read dir: {}", e))? {
    let entry = entry.map_err(|e| format!("Dir entry error: {}", e))?;
    let path = entry.path();
    if path.is_file() {
      if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        if ext.eq_ignore_ascii_case("apk") { apks.push(path); }
      }
    }
  }
  if apks.is_empty() {
    return Err("No .apk files found in selected folder".into());
  }

  // Sort to try keeping base first (heuristic: name without split suffix comes first)
  apks.sort_by(|a, b| a.file_name().unwrap().to_string_lossy().cmp(&b.file_name().unwrap().to_string_lossy()));

  let mut cmd = make_cmd(Command::new(&adb));
  if apks.len() > 1 {
    cmd.arg("install-multiple");
  } else {
    cmd.arg("install");
  }
  cmd.arg("-r");
  cmd.arg("--user");
  cmd.arg("0");
  for apk in &apks { cmd.arg(apk); }

  let output = cmd.stdout(Stdio::piped()).output().map_err(|e| format!("Failed to run adb ({}): {}", adb, e))?;
  let out = String::from_utf8_lossy(&output.stdout).to_string();
  if !output.status.success() || (!out.contains("Success") && !out.to_lowercase().contains("success")) {
    return Err(format!("Install failed: {}", out));
  }
  Ok(format!("Restored {} APK(s) from {}\n{}", apks.len(), p.to_string_lossy(), out))
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      list_devices,
      list_packages,
      uninstall_package,
      reboot_device,
      check_update,
      restore_from_backup,
      get_backups_latest
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

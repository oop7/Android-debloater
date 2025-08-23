# Android Debloater (Tauri + Rust + React)

A fast, modern desktop app to discover, research, uninstall, and restore Android apps — with ADB bundled for you.

## Highlights
- Device discovery and connection status
- Scan installed packages and filter with live search
- Batch uninstall (with confirmation)
- Automatic APK backup before every uninstall
- One‑click restore from the default backups folder (modal picker)
- Right‑click any package to search the web for info
- Update checker (GitHub latest)
- Windows: no flashing console windows during ADB calls
- Bundled platform‑tools (ADB) — no PATH setup

## Install
- Windows: download `.exe` or `.msi` from Releases and install.
- macOS/Linux: build from source (or use CI artifacts when available).

## Quick start
1) On your phone, enable Developer options and turn on USB debugging.
2) Connect the phone via USB and allow the PC when prompted.
3) Open the app → “Scan for Installed Packages”.
4) Use the search bar to filter, select apps, then “Uninstall Selected”.
5) To restore later: “Restore from Backup” → pick the app from the list.

## Backups
- Location: `Documents/AndroidDebloater/backups/<package>-<unix_ts>/`
- Contents: APK or split APKs pulled via ADB
- Restore: uses `adb install` or `adb install-multiple` automatically

## Build from source
Prereqs: Node.js 18+ (or 20+), Rust (stable), cargo

Dev run (PowerShell):
```pwsh
npm install
npm run tauri:dev
```

Create installers (PowerShell):
```pwsh
npm run tauri:build
```

Linux build deps (reference):
- libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev libsoup2.4-dev libglib2.0-dev libjavascriptcoregtk-4.0-dev

## Project structure
- `src/` React UI (TypeScript)
  - `App.tsx` main UI
  - `components/RestoreModal.tsx` restore picker modal
  - `api.ts` typed wrapper around Tauri invokes
  - `types.ts` shared types
- `src-tauri/` Rust backend
  - `src/main.rs` commands: devices, packages, uninstall+backup, restore, update
  - `tauri.conf.json` bundling (includes `platform-tools`);
  - `icons/` app icons
- `platform-tools/` bundled ADB used at runtime

## How ADB is resolved
The app only uses the bundled `platform-tools` from its resources (including Windows NSIS `_up_` layout). It does not rely on your system PATH.

## Troubleshooting
- Device not detected:
  - Ensure USB debugging is enabled; accept the authorization prompt.
  - Try a different cable/port. On Windows, install OEM/Google USB drivers.
- Restore says “No .apk files found”:
  - Select the specific backup folder created by the app (not its parent).
- ADB not found error:
  - Make sure the `platform-tools` folder is included with the app (it is bundled in installers).

## CI/CD
GitHub Actions build and draft-release on tags like `v*` across Windows/macOS/Linux.

## License
GPL‑3.0. See `LICENSE`.

## Disclaimer
Removing system packages can affect device functionality. Research before removal and keep backups. Use at your own risk.

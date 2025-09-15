# Android Debloater

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub release](https://img.shields.io/github/release/oop7/Android-debloater.svg)](https://github.com/oop7/Android-debloater/releases)

A fast, modern desktop app to discover, research, uninstall, and restore Android apps — with ADB bundled for you. Built with Tauri, Rust, and React.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Backups](#backups)
- [Building from Source](#building-from-source)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Disclaimer](#disclaimer)

## Features

- 🔍 **Device Discovery**: Automatically detect and connect to Android devices
- 📱 **Package Scanning**: Scan installed packages with live search and filtering
- 🗑️ **Batch Uninstall**: Uninstall multiple apps at once with confirmation
- 💾 **Automatic Backups**: Create APK backups before every uninstall
- 🔄 **One-Click Restore**: Restore apps from backups with a modal picker
- 🌐 **Web Search**: Right-click any package to search for information online
- 🔄 **Update Checker**: Check for app updates from GitHub releases
- 🚀 **Cross-Platform**: Windows, macOS, and Linux support
- 📦 **Bundled ADB**: Platform-tools included, no manual PATH setup required

## Installation

### Windows
Download the latest installer from the [Releases](https://github.com/oop7/Android-debloater/releases) page:
- `Android.Debloater_x64-setup.exe` - EXE installer
- `Android.Debloater_x64_en-US.msi` - MSI installer

### macOS
Download from the [Releases](https://github.com/oop7/Android-debloater/releases) page:
- `Android.Debloater.app.zip` - Universal app bundle
- `Android.Debloater_aarch64.dmg` - ARM64 DMG (for Apple Silicon)

### Linux
Download from the [Releases](https://github.com/oop7/Android-debloater/releases) page:
- `android-debloater_amd64.deb` - Debian/Ubuntu package
- `android-debloater_x86_64.rpm` - RPM package
- `android-debloater_amd64.AppImage` - AppImage (universal)

**Verify downloads**: Check `SHA256SUMS.txt` for file integrity.

### Build from Source
If you prefer to build from source or no pre-built binaries are available for your platform:

## Quick Start

1. **Enable Developer Options** on your Android device:
   - Go to Settings > About Phone > Tap "Build Number" 7 times
   - Return to Settings > Developer Options > Enable "USB Debugging"

2. **Connect your device** via USB and allow the PC when prompted.

3. **Open the app** and click "Scan for Installed Packages".

4. **Filter and select apps** using the search bar, then click "Uninstall Selected".

5. **To restore**: Click "Restore from Backup" and select the app from the list.

## Backups

- **Location**: `Documents/AndroidDebloater/backups/<package>-<unix_ts>/`
- **Contents**: APK files or split APKs pulled via ADB
- **Restore Process**: Uses `adb install` or `adb install-multiple` automatically
- **Safety**: Always creates backups before uninstalling system apps

## Building from Source

### Prerequisites
- Node.js 18+ (recommended: 20+)
- Rust (stable)
- Cargo

### Development
```bash
npm install
npm run tauri:dev
```

### Build Installers
```bash
npm run tauri:build
```

### Linux Dependencies
```bash
sudo apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev libsoup2.4-dev libglib2.0-dev libjavascriptcoregtk-4.0-dev
```

## Project Structure

```
src/                    # React UI (TypeScript)
├── App.tsx            # Main UI component
├── components/
│   └── RestoreModal.tsx # Restore picker modal
├── api.ts             # Tauri invoke wrapper
├── types.ts           # Shared TypeScript types
└── styles.css         # App styles

src-tauri/             # Rust backend
├── src/main.rs        # Tauri commands (devices, packages, etc.)
├── tauri.conf.json    # Tauri configuration
├── Cargo.toml         # Rust dependencies
└── icons/             # App icons

platform-tools/        # Bundled ADB tools
```

## Troubleshooting

### Device Not Detected
- Ensure USB debugging is enabled and you've accepted the authorization prompt
- Try a different USB cable or port
- On Windows: Install OEM/Google USB drivers
- Restart ADB: `adb kill-server && adb start-server`

### Restore Issues
- Select the specific backup folder created by the app (not its parent)
- Ensure the APK files are intact in the backup directory

### ADB Errors
- Verify that the `platform-tools` folder is bundled with the app
- For manual builds, ensure ADB is in your system PATH

### Common ADB Commands
If you need to troubleshoot manually:
```bash
adb devices                    # List connected devices
adb shell pm list packages     # List all packages
adb uninstall <package>        # Uninstall a package
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request

### Development Setup
See [Building from Source](#building-from-source) for setup instructions.

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

⚠️ **Warning**: Removing system packages can affect device functionality and stability. Always research packages before removal and keep backups. Use this tool at your own risk. The developers are not responsible for any damage to your device or data loss.

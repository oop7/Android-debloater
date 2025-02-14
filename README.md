# **Android Debloater** 🚀

**Take Control of Your Android Device - Debloat, Manage, and Optimize!**

<p align="center">
  <img src="https://i.imgur.com/j54OzxP.png" alt="Android Debloater Main Interface" width="80%" />
  <br>
  <em>Modern and Efficient Android Debloater Interface</em>
</p>

Android Debloater is a modern, user-friendly, and cross-platform GUI tool designed to help you manage and remove unwanted pre-installed applications (often referred to as "bloatware") from your Android devices. Built with the sleek and powerful PySide6 framework, this application offers a stylish dark-themed interface and a range of features to streamline your Android device and enhance performance.

Tired of unnecessary apps cluttering your device, consuming resources, and potentially impacting privacy? Android Debloater empowers you to reclaim control, declutter your Android experience, and optimize your device's performance.

## 💪 Key Features

- **✨ Sleek & Modern Dark UI**:
    - Enjoy a visually appealing and eye-friendly dark theme, perfect for extended use.
    - Experience enhanced UI elements with custom scrollbar styling and list item design.
    - Benefit from improved readability with alternating row colors in package lists.

- **📦 Comprehensive Package Management**:
    - Effortlessly **list all installed packages** on your connected Android device.
    - **Intelligent Search & Filtering**: Quickly find specific packages using the real-time search bar.
    - **Batch Uninstall**: Select and uninstall multiple packages simultaneously for efficient debloating.
    - **🔍 Search Package Info Online**: Right-click on any package in the list and select "**Search Online**" to instantly look up detailed information about the package using your web browser. Understand what each package does before making removal decisions.

- **📱 Intuitive Device Control**:
    - **Real-time Device Monitoring**: Clearly see connected devices and their connection status in a dedicated section.
    - **Safe & Confirmed Actions**: Uninstallations are performed safely with user confirmation dialogs to prevent accidental removals.
    - **Convenient Device Reboot**: Reboot your connected Android device directly from within the application.
    - **Operation Progress Tracking**: Monitor the progress of package scanning and uninstallation operations with a visual progress bar.

- **🔄 Stay Up-to-Date with Auto-Update**:
    - Integrated update checker ensures you are always running the latest version of Android Debloater, benefiting from new features and improvements.

- **💻 Cross-Platform Compatibility**:
    - Designed to work seamlessly across **Windows**, **macOS**, and **Linux** operating systems, providing a consistent experience regardless of your desktop environment.

- **⚠️ Robust Error Handling & Feedback**:
    - Clear error messages and warnings guide you through potential issues.
    - Detailed logging to `adb_log.txt` for troubleshooting and advanced diagnostics.

## 🧩 Requirements

Before you begin, ensure you have the following prerequisites in place:

- **Android Debug Bridge (ADB)**:  This is essential for communication between your computer and your Android device.
  - **Download Platform Tools**: Get the latest ADB binaries from [Android SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools).
  - **Add ADB to PATH**:  Make ADB accessible system-wide by adding the downloaded `platform-tools` directory to your system's `PATH` environment variable. This allows you to run `adb` commands from any terminal location.

- **USB Debugging Enabled on Android Device**: You must enable USB Debugging in your Android device's developer options.
  - **Enable Developer Options**: Go to "Settings" > "About phone" (or similar) and tap "Build number" repeatedly (usually 7 times) until "Developer options" are enabled.
  - **Enable USB Debugging**: Navigate to "Settings" > "Developer options" and toggle on "USB debugging".

- **Python 3.8+**: Required for running the application from source. [Download Python](https://www.python.org/downloads/) if you don't have it installed.

## 💻 Installation & Usage

**For the most stable experience, it is recommended to run Android Debloater directly from the Python source code.** This ensures you are using the most up-to-date version and can sometimes avoid issues related to platform-specific builds.

### Running from Source (Recommended)

1. **Clone the Repository**:
```bash
git clone https://github.com/oop7/Android-debloater.git
cd Android-debloater
```

2. **Install dependencies**:
```
pip install -r requirements.txt
```

3. **Run the application**:
```bash
python ABDLT.py
```
### Pre-built Executables (Alternative)

If you prefer a standalone executable for convenience, you can download pre-compiled versions for your operating system from the [Releases Section](https://github.com/oop7/Android-debloater/releases) on GitHub:

- **Windows**: Download the `.exe` executable.
- **macOS**: Download the `.dmg` disk image.
- **Linux**: Download the `.AppImage` file.

Simply download the appropriate file for your system and run it. While these executables offer ease of use, please note:

- **Potential Compatibility Issues**: Pre-built executables might encounter platform-specific issues that are less likely when running directly from the Python source code.
- **Slightly Delayed Updates**: Executable releases might lag behind the most recent source code updates.

**For the most robust and up-to-date experience, running from source (as described in the "Running from Source (Recommended)" section above) is still the preferred method.**  However, if you prioritize simplicity and a quick start, the pre-built executables offer a convenient alternative.

### Basic Usage Guide (Applies to both Source and Executables)

1. **Connect Your Android Device**:
   - Connect your Android device to your computer using a USB cable.
   - Ensure USB debugging is enabled on your device (as per the [Requirements](#-requirements) section).
   - You might be prompted on your device to authorize USB debugging from your computer - **allow this connection**.

2. **Launch Android Debloater**:
   - Run the Android Debloater application (either by executing `python ADBLT.py` from source or launching the downloaded executable).

3. **Verify Device Connection**:
   - In the application's interface, check the "Connected Devices" section. Your device should be listed, indicating a successful ADB connection. If no device is listed, ensure ADB is correctly installed and your device is properly connected with USB debugging enabled. Try clicking the "Refresh Devices" button.

4. **Scan for Packages**:
   - Click the "**Scan for Installed Packages**" button. The application will use ADB to retrieve a list of all packages installed on your device. This process may take a moment.

5. **Search and Filter Packages**:
   - Use the **search bar** at the top to filter the package list. Type keywords to quickly find specific packages or types of applications you are looking for.

6. **Explore Package Information Online**:
   - **Right-click** on any package in the list.
   - Select "**Search Online**" from the context menu.
   - Your default web browser will open, performing a Google search for information about the selected package. This is a powerful way to understand what a package is and whether it is safe to remove.

7. **Select Packages for Uninstallation**:
   - **Select the checkboxes** next to the packages you wish to uninstall. You can select multiple packages for batch uninstallation. **Exercise caution** and research packages before removing them, especially system applications.

8. **Uninstall Selected Packages**:
   - Click the "**Uninstall Selected**" button.
   - A confirmation dialog will appear. **Carefully review your selections** before confirming the uninstallation process.
   - Click "**Yes**" to proceed with uninstallation. The application will use ADB to uninstall the selected packages one by one, showing progress in the status bar.

9. **Reboot Device (Optional)**:
    - After uninstalling packages, especially system apps, it's often recommended to reboot your device for changes to fully take effect.
    - Click the "**Reboot Device**" button to initiate a device reboot via ADB.


## 📜 License

This project is licensed under the GPL-3.0 License. See the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

- Removing system packages can affect device functionality
- Some packages may be required for proper device operation
- Use this tool at your own risk
- Always research packages before removal
- Consider making a backup before removing packages

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or create issues for bugs and feature requests.

## 📱 Device Compatibility

- Android 4.0+ devices
- Requires USB debugging enabled
- Works with most Android manufacturers
- Root access not required (but provides additional capabilities if available)
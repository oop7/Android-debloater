import sys
import subprocess
import logging
import requests
import json
from urllib.parse import urlparse
import os
from PySide6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QPushButton, QListWidget, QMessageBox, 
    QLineEdit, QCheckBox, QLabel, QProgressBar, QHBoxLayout, QMenu
)
from PySide6.QtGui import QIcon, QFont
from PySide6.QtCore import Qt, QThread, Signal

# Set up logging to file in user's home directory
log_path = os.path.expanduser("~/adb_debloater.log")
logging.basicConfig(filename=log_path, level=logging.DEBUG, format='%(asctime)s %(message)s')

class UpdateCheckerThread(QThread):
    update_found = Signal(str)
    error_occurred = Signal(str)
    
    def __init__(self, current_version="2.0.0"):
        super().__init__()
        self.current_version = current_version
        
    def run(self):
        try:
            # Using raw URL to get redirect information
            response = requests.get(
                "https://github.com/oop7/Android-debloater/releases/latest",
                allow_redirects=True
            )
            
            if response.status_code == 200:
                # Extract version from the final URL path
                final_url = response.url
                path_parts = urlparse(final_url).path.split('/')
                if 'releases/tag' in final_url:
                    latest_version = path_parts[-1]  # Get the version from URL
                    if latest_version.startswith('v'):
                        latest_version = latest_version[1:]  # Remove 'v' prefix if present
                    if latest_version > self.current_version:
                        self.update_found.emit(latest_version)
                    else:
                        self.error_occurred.emit("You are using the latest version")
                else:
                    self.error_occurred.emit("Could not determine latest version")
            else:
                self.error_occurred.emit(f"Server returned status code: {response.status_code}")
        except Exception as e:
            self.error_occurred.emit(f"Update check failed: {str(e)}")

class AndroidDebloater(QWidget):
    def __init__(self):
        super().__init__()
        self.version = "2.0.0"
        self.initUI()
        self.connected_devices = []  # Add list to store connected devices

    def initUI(self):
        # Set window title and size
        self.setWindowTitle(f"Android Debloater v{self.version}")
        self.setGeometry(300, 300, 600, 800)

        # Set application icon - using a system icon as placeholder
        self.setWindowIcon(QIcon.fromTheme("phone", QIcon.fromTheme("system-software-update")))

        # Create layout
        self.layout = QVBoxLayout()
        self.layout.setSpacing(10)
        self.layout.setContentsMargins(20, 20, 20, 20)

        # Header section
        header_layout = QHBoxLayout()
        title_label = QLabel("Android Debloater")
        title_label.setFont(QFont("Arial", 18, QFont.Bold))
        header_layout.addWidget(title_label)
        
        # Update checker button
        self.update_button = QPushButton("Check for Updates")
        self.update_button.clicked.connect(self.check_for_updates)
        header_layout.addWidget(self.update_button)
        self.layout.addLayout(header_layout)

        # Add devices section after header
        devices_layout = QHBoxLayout()
        self.devices_label = QLabel("Connected Devices:")
        self.devices_list = QListWidget()
        self.devices_list.setMaximumHeight(60)
        self.refresh_devices_button = QPushButton("Refresh Devices")
        self.refresh_devices_button.clicked.connect(self.refresh_devices)
        
        devices_layout.addWidget(self.devices_label)
        devices_layout.addWidget(self.devices_list)
        devices_layout.addWidget(self.refresh_devices_button)
        self.layout.addLayout(devices_layout)

        # Search bar with improved styling
        search_layout = QHBoxLayout()
        self.search_bar = QLineEdit(self)
        self.search_bar.setPlaceholderText("Search packages...")
        self.search_bar.textChanged.connect(self.filter_packages)
        search_layout.addWidget(self.search_bar)
        self.layout.addLayout(search_layout)

        # Progress bar for operations
        self.progress_bar = QProgressBar()
        self.progress_bar.hide()
        self.layout.addWidget(self.progress_bar)

        # List packages button
        button_layout = QHBoxLayout()
        self.list_button = QPushButton("Scan for Installed Packages", self)
        self.list_button.clicked.connect(self.list_packages)
        button_layout.addWidget(self.list_button)

        # Add reboot button
        self.reboot_button = QPushButton("Reboot Device", self)
        self.reboot_button.clicked.connect(self.reboot_device)
        button_layout.addWidget(self.reboot_button)
        self.layout.addLayout(button_layout)

        # Package list with counter and improved styling
        self.package_count_label = QLabel("0 packages found")
        self.layout.addWidget(self.package_count_label)
        
        self.package_list = QListWidget(self)
        self.package_list.setSelectionMode(QListWidget.MultiSelection)
        self.package_list.setContextMenuPolicy(Qt.CustomContextMenu)  # Enable right-click menu
        self.package_list.customContextMenuRequested.connect(self.show_context_menu)
        self.package_list.setAlternatingRowColors(True)  # Improve readability
        self.package_list.setSpacing(2)  # Add spacing between items
        self.layout.addWidget(self.package_list)

        # Action buttons layout - remove install button
        action_buttons_layout = QHBoxLayout()
        
        # Uninstall button
        self.uninstall_button = QPushButton("Uninstall Selected", self)
        self.uninstall_button.clicked.connect(self.confirm_uninstall)
        action_buttons_layout.addWidget(self.uninstall_button)

        self.layout.addLayout(action_buttons_layout)

        # Status bar
        self.status_label = QLabel("")
        self.layout.addWidget(self.status_label)

        self.setLayout(self.layout)
        self.all_packages = []
        
        # Apply modern dark styling by default
        self.apply_styling()

        # Initial device refresh
        self.refresh_devices()

    def apply_styling(self):
        """Apply modern dark theme styling."""
        style = """
            QWidget {
                background-color: #1e1e1e;
                color: #ffffff;
            }
            QPushButton {
                background-color: #0d47a1;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px;
                font-weight: bold;
                min-width: 100px;
            }
            QPushButton:hover {
                background-color: #1565c0;
            }
            QPushButton:pressed {
                background-color: #0a367a;
            }
            QListWidget {
                background-color: #2d2d2d;
                border: 1px solid #3d3d3d;
                border-radius: 4px;
                padding: 5px;
            }
            QListWidget::item {
                padding: 8px;
                border-radius: 2px;
            }
            QListWidget::item:selected {
                background-color: #0d47a1;
                color: white;
            }
            QListWidget::item:hover {
                background-color: #3d3d3d;
            }
            QListWidget::item:alternate {
                background-color: #262626;
            }
            QLineEdit {
                background-color: #2d2d2d;
                border: 1px solid #3d3d3d;
                border-radius: 4px;
                padding: 5px;
            }
            QProgressBar {
                border: 1px solid #3d3d3d;
                border-radius: 4px;
                text-align: center;
            }
            QProgressBar::chunk {
                background-color: #0d47a1;
            }
            QScrollBar:vertical {
                border: none;
                background: #2d2d2d;
                width: 10px;
                margin: 0px;
            }
            QScrollBar::handle:vertical {
                background: #404040;
                min-height: 20px;
                border-radius: 5px;
            }
            QScrollBar::handle:vertical:hover {
                background: #4d4d4d;
            }
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
                height: 0px;
            }
            QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical {
                background: none;
            }
        """
        self.setStyleSheet(style)

    def reboot_device(self):
        """Reboot the connected Android device."""
        msg = QMessageBox()
        msg.setIcon(QMessageBox.Warning)
        msg.setText("Are you sure you want to reboot the device?")
        msg.setInformativeText("The device will restart immediately.")
        msg.setStandardButtons(QMessageBox.Yes | QMessageBox.No)
        
        if msg.exec_() == QMessageBox.Yes:
            try:
                result = subprocess.run(['adb', 'reboot'], capture_output=True, text=True)
                if result.returncode == 0:
                    self.status_label.setText("Device is rebooting...")
                    logging.info("Device reboot initiated")
                else:
                    raise Exception(f"Reboot failed: {result.stderr}")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to reboot device: {str(e)}")
                logging.error(f"Reboot error: {str(e)}")

    def check_for_updates(self):
        """Check for updates using a separate thread."""
        self.update_button.setEnabled(False)
        self.status_label.setText("Checking for updates...")
        
        self.update_checker = UpdateCheckerThread(self.version)
        self.update_checker.update_found.connect(self.handle_update_found)
        self.update_checker.error_occurred.connect(self.handle_update_error)
        self.update_checker.finished.connect(lambda: self.update_button.setEnabled(True))
        self.update_checker.start()

    def handle_update_found(self, new_version):
        """Handle when a new update is found."""
        msg = QMessageBox()
        msg.setIcon(QMessageBox.Information)
        msg.setText(f"New version {new_version} available!")
        msg.setInformativeText("Would you like to visit the download page?")
        msg.setStandardButtons(QMessageBox.Yes | QMessageBox.No)
        if msg.exec_() == QMessageBox.Yes:
            # Open browser to release page
            import webbrowser
            webbrowser.open("https://github.com/oop7/Android-debloater/releases")

    def handle_update_error(self, error):
        """Handle update check errors."""
        self.status_label.setText(f"Update check failed: {error}")

    def confirm_uninstall(self):
        """Confirm before uninstalling packages."""
        selected_items = self.package_list.selectedItems()
        if not selected_items:
            QMessageBox.warning(self, "Warning", "No packages selected.")
            return

        msg = QMessageBox()
        msg.setIcon(QMessageBox.Warning)
        msg.setText(f"Are you sure you want to uninstall {len(selected_items)} packages?")
        msg.setInformativeText("This action cannot be undone!")
        msg.setStandardButtons(QMessageBox.Yes | QMessageBox.No)
        if msg.exec_() == QMessageBox.Yes:
            self.uninstall_packages()

    def list_packages(self):
        """Fetch the list of installed packages from the Android device."""
        self.package_list.clear()
        self.all_packages.clear()
        try:
            # Run the adb command to list packages
            result = subprocess.run(['adb', 'shell', 'pm', 'list', 'packages'], capture_output=True, text=True)
            packages = result.stdout.splitlines()

            if packages:
                for package in packages:
                    # Only process lines that have the correct format
                    if ":" in package:
                        package_name = package.split(":")[1].strip()
                        self.all_packages.append(package_name)
                self.update_package_list()
            else:
                QMessageBox.warning(self, "Error", "No packages found or device not connected.")
                logging.warning("No packages found or device not connected.")
        except Exception as e:
            QMessageBox.critical(self, "Error", str(e))
            logging.critical(f"Error listing packages: {str(e)}")

    def filter_packages(self):
        """Filter the displayed packages based on the search input."""
        search_text = self.search_bar.text().lower()
        filtered_packages = [pkg for pkg in self.all_packages if search_text in pkg.lower()]
        self.package_list.clear()
        self.package_list.addItems(filtered_packages)

    def update_package_list(self):
        """Update the package list in the GUI."""
        self.package_list.clear()
        self.package_list.addItems(self.all_packages)
        self.package_count_label.setText(f"{len(self.all_packages)} packages found")

    def uninstall_packages(self):
        """Uninstall selected packages from the Android device."""
        selected_items = self.package_list.selectedItems()

        if not selected_items:
            QMessageBox.warning(self, "Warning", "No packages selected.")
            return

        for item in selected_items:
            package_name = item.text()
            logging.debug(f"Uninstalling package: {package_name}")
            if not package_name:
                logging.warning("Package name is empty or invalid.")
                continue

            try:
                # Run ADB uninstall command
                result = subprocess.run(['adb', 'shell', 'pm', 'uninstall', '--user', '0', package_name], capture_output=True, text=True)
                logging.debug(f"ADB result: {result.stdout}")

                # Check the result
                if "Success" in result.stdout:
                    QMessageBox.information(self, "Success", f"Package {package_name} uninstalled.")
                    logging.info(f"{package_name} uninstalled successfully.")
                elif "Failure" in result.stdout:
                    QMessageBox.warning(self, "Error", f"Failed to uninstall {package_name}: {result.stdout}")
                    logging.error(f"Failed to uninstall {package_name}: {result.stdout}")
                else:
                    QMessageBox.warning(self, "Error", f"Unexpected response for {package_name}: {result.stdout}")
                    logging.error(f"Unexpected response for {package_name}: {result.stdout}")

            except Exception as e:
                QMessageBox.critical(self, "Error", str(e))
                logging.critical(f"Error uninstalling package {package_name}: {str(e)}")

    def refresh_devices(self):
        """Refresh the list of connected devices."""
        try:
            self.devices_list.clear()
            result = subprocess.run(['adb', 'devices'], capture_output=True, text=True)
            lines = result.stdout.strip().split('\n')[1:]  # Skip the first line (header)
            self.connected_devices = []
            
            for line in lines:
                if line.strip():
                    device, status = line.split('\t')
                    self.connected_devices.append(device)
                    self.devices_list.addItem(f"{device} ({status})")
            
            if not self.connected_devices:
                self.devices_list.addItem("No devices connected")
                self.list_button.setEnabled(False)
                self.uninstall_button.setEnabled(False)
                self.reboot_button.setEnabled(False)
            else:
                self.list_button.setEnabled(True)
                self.uninstall_button.setEnabled(True)
                self.reboot_button.setEnabled(True)
                
        except Exception as e:
            self.devices_list.addItem("Error detecting devices")
            logging.error(f"Error refreshing devices: {str(e)}")

    def show_context_menu(self, position):
        """Show context menu for package list items."""
        item = self.package_list.itemAt(position)
        if item:
            menu = QMenu()
            search_action = menu.addAction("Search Online")
            action = menu.exec(self.package_list.viewport().mapToGlobal(position))
            
            if action == search_action:
                package_name = item.text()
                import webbrowser
                # Search using Google
                search_url = f"https://www.google.com/search?q={package_name}+android+package+info"
                webbrowser.open(search_url)


if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = AndroidDebloater()
    ex.show()
    sys.exit(app.exec())
import { invoke } from '@tauri-apps/api/tauri';
import type { DeviceInfo, BackupEntry } from './types';

export const api = {
  listDevices: () => invoke<DeviceInfo[]>('list_devices'),
  listPackages: () => invoke<string[]>('list_packages'),
  uninstall: (pkg: string) => invoke<string>('uninstall_package', { package: pkg }),
  reboot: () => invoke('reboot_device'),
  checkUpdate: (current: string) => invoke<{ latest: string; outdated: boolean }>('check_update', { current }),
  getBackupsLatest: () => invoke<BackupEntry[]>('get_backups_latest'),
  restoreFromDir: (dir: string) => invoke<string>('restore_from_backup', { dir }),
};

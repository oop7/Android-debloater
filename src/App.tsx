import React, { useEffect, useMemo, useState } from 'react';
import { open } from '@tauri-apps/api/shell';
import { open as openDialog } from '@tauri-apps/api/dialog';
import { api } from './api';
import type { DeviceInfo, BackupEntry } from './types';
import { RestoreModal } from './components/RestoreModal';

export default function App() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [packages, setPackages] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState('');
  const [version] = useState('2.0.0');
  const [updateMsg, setUpdateMsg] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return packages.filter(p => p.toLowerCase().includes(q));
  }, [packages, query]);

  async function refreshDevices() {
    try {
      const res = await api.listDevices();
      setDevices(res);
    } catch (e: any) {
      setStatus(`Error refreshing devices: ${e}`);
    }
  }

  async function scanPackages() {
    setStatus('Scanning packages...');
    try {
  const pkgs = await api.listPackages();
      setPackages(pkgs);
      setSelected(new Set());
      setStatus(`Found ${pkgs.length} packages`);
    } catch (e: any) {
      setStatus(`Error listing packages: ${e}`);
    }
  }

  async function uninstallSelected() {
    if (selected.size === 0) {
      alert('No packages selected.');
      return;
    }
    if (!confirm(`Uninstall ${selected.size} packages? This cannot be undone.`)) return;
    setStatus('Uninstalling...');
    for (const pkg of selected) {
      try {
  const result = await api.uninstall(pkg);
        if (result.includes('Success')) {
          setStatus(prev => `${prev}\n${pkg} uninstalled.`);
        } else {
          setStatus(prev => `${prev}\nFailed ${pkg}: ${result}`);
        }
      } catch (e: any) {
        setStatus(prev => `${prev}\nError ${pkg}: ${e}`);
      }
    }
  // Clear search so the full list shows again
  setQuery('');
  await scanPackages();
  }

  async function reboot() {
    if (!confirm('Reboot connected device now?')) return;
    try {
  await api.reboot();
      setStatus('Device rebooting...');
    } catch (e: any) {
      setStatus(`Reboot failed: ${e}`);
    }
  }

  async function checkUpdates() {
    setUpdateMsg('Checking updates...');
    try {
  const res = await api.checkUpdate(version);
      if (res.outdated) {
        if (confirm(`New version ${res.latest} available. Open release page?`)) {
          await open('https://github.com/oop7/Android-debloater/releases');
        }
        setUpdateMsg(`New version ${res.latest} available.`);
      } else {
        setUpdateMsg('You are using the latest version.');
      }
    } catch (e: any) {
      setUpdateMsg(`Update check failed: ${e}`);
    }
  }

  async function restoreFromBackup() {
    try {
      setRestoring(true);
  // Show modal immediately and load backups asynchronously
  setBackups([]);
  setShowRestore(true);
  setLoadingBackups(true);
  const list = await api.getBackupsLatest();
  setBackups(list);
  setLoadingBackups(false);
    } catch (e: any) {
      setStatus(prev => `${prev}\nRestore failed: ${e}`);
    } finally {
      setRestoring(false);
    }
  }

  async function doRestore(entry: BackupEntry) {
    try {
      setShowRestore(false);
      setStatus(`Restoring ${entry.package} from backup...`);
  const result = await api.restoreFromDir(entry.dir);
      setStatus(prev => `${prev}\n${result}`);
    } catch (e: any) {
      setStatus(prev => `${prev}\nRestore failed: ${e}`);
    }
  }

  useEffect(() => {
    refreshDevices();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>Android Debloater</h1>
        <div className="spacer" />
        <button onClick={checkUpdates}>Check for Updates</button>
      </header>

      <section className="devices">
        <h3>Connected Devices</h3>
        <div className="row">
          <ul className="device-list">
            {devices.length === 0 ? (
              <li>No devices connected</li>
            ) : (
              devices.map(d => (
                <li key={d.id}>{d.id} ({d.status})</li>
              ))
            )}
          </ul>
          <button onClick={refreshDevices}>Refresh Devices</button>
        </div>
      </section>

      <section className="actions">
        <div className="row">
          <input
            type="text"
            placeholder="Search packages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="row">
            <button onClick={scanPackages}>Scan for Installed Packages</button>
            <button onClick={reboot}>Reboot Device</button>
            <button onClick={restoreFromBackup} disabled={restoring}>Restore from Backup</button>
          </div>
        </div>
      </section>

      <section className="packages">
        <div className="row between">
          <span>{packages.length} packages found</span>
          <button onClick={uninstallSelected}>Uninstall Selected</button>
        </div>
        <ul className="pkg-list">
          {filtered.map(pkg => (
            <li key={pkg} className="pkg-item" onContextMenu={async (e) => { e.preventDefault(); await open(`https://www.google.com/search?q=${encodeURIComponent(pkg + ' android package info')}`); }}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.has(pkg)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(pkg); else next.delete(pkg);
                    setSelected(next);
                  }}
                />
                <span>{pkg}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <RestoreModal
        open={showRestore}
        loading={loadingBackups}
        backups={backups}
        onCancel={() => setShowRestore(false)}
        onSelect={doRestore}
        onPickFolder={async () => {
          const dir = await openDialog({ directory: true, multiple: false, title: 'Select backup folder (contains .apk files)' });
          if (dir) {
            setShowRestore(false);
            const result = await api.restoreFromDir(dir as string);
            setStatus(prev => `${prev}\n${result}`);
          }
        }}
      />

      <footer className="status">
        <div>{updateMsg}</div>
        <pre className="log">{status}</pre>
      </footer>
    </div>
  );
}

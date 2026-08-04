import React, { useEffect, useMemo, useState } from 'react';
import { open } from '@tauri-apps/api/shell';
import { open as openDialog } from '@tauri-apps/api/dialog';
import { api } from './api';
import type { DeviceInfo, BackupEntry, PackageInfo } from './types';
import { getFriendlyName } from './appNames';
import { RestoreModal } from './components/RestoreModal';

export default function App() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState('');
  const [version] = useState('2.5.6');
  const [updateMsg, setUpdateMsg] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return packages;
    return packages.filter(
      p => p.name.toLowerCase().includes(q) || p.package.toLowerCase().includes(q)
    );
  }, [packages, query]);

  const isAllFilteredSelected = useMemo(() => {
    if (filtered.length === 0) return false;
    return filtered.every(p => selected.has(p.package));
  }, [filtered, selected]);

  function toggleSelectAllFiltered() {
    const next = new Set(selected);
    if (isAllFilteredSelected) {
      for (const p of filtered) {
        next.delete(p.package);
      }
    } else {
      for (const p of filtered) {
        next.add(p.package);
      }
    }
    setSelected(next);
  }

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
      const res = await api.listPackages();
      const formatted: PackageInfo[] = res.map((item: any) => {
        if (typeof item === 'string') {
          return { package: item, name: getFriendlyName(item) };
        }
        return {
          package: item.package,
          name: getFriendlyName(item.package, item.name),
        };
      });
      setPackages(formatted);
      setSelected(new Set());
      setStatus(`Found ${formatted.length} packages`);
    } catch (e: any) {
      setStatus(`Error listing packages: ${e}`);
    }
  }

  async function uninstallSelected() {
    if (selected.size === 0) {
      alert('No packages selected.');
      return;
    }
    const count = selected.size;
    if (!confirm(`Uninstall ${count} app${count === 1 ? '' : 's'} selected? This cannot be undone.`)) return;
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
      const friendly = getFriendlyName(entry.package);
      setStatus(`Restoring ${friendly} (${entry.package}) from backup...`);
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
        <h1>Android-debloater-rs</h1>
        <div className="spacer" />
        <button onClick={checkUpdates}>Check for Updates</button>
      </header>

      <section className="devices" aria-labelledby="devices-heading">
        <h3 id="devices-heading">Connected Devices</h3>
        <div className="row">
          <ul className="device-list" aria-label="Connected Devices List">
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
            placeholder="Search packages by name or ID..."
            aria-label="Search packages by name or package ID"
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

      <section className="packages" aria-labelledby="packages-summary">
        <div className="row between pkg-header-bar">
          <div className="pkg-summary" id="packages-summary" aria-live="polite">
            <span>{packages.length} packages found</span>
            {selected.size > 0 && (
              <span className="selected-badge">
                {selected.size} app{selected.size === 1 ? '' : 's'} selected
              </span>
            )}
          </div>
          <div className="row action-buttons">
            {filtered.length > 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={toggleSelectAllFiltered}
                aria-label={isAllFilteredSelected ? 'Deselect all filtered packages' : 'Select all filtered packages'}
              >
                {isAllFilteredSelected ? 'Deselect Filtered' : 'Select Filtered'}
              </button>
            )}
            {selected.size > 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelected(new Set())}
                aria-label="Clear all package selections"
              >
                Clear Selection
              </button>
            )}
            <button
              onClick={uninstallSelected}
              disabled={selected.size === 0}
              className="btn-danger"
              aria-label={selected.size > 0 ? `Uninstall ${selected.size} selected app${selected.size === 1 ? '' : 's'}` : 'Uninstall selected apps'}
            >
              {selected.size > 0
                ? `Uninstall (${selected.size} app${selected.size === 1 ? '' : 's'} selected)`
                : 'Uninstall Selected'}
            </button>
          </div>
        </div>
        <ul className="pkg-list" aria-label="Installed Packages List">
          {filtered.map(item => (
            <li
              key={item.package}
              className="pkg-item"
              onContextMenu={async (e) => {
                e.preventDefault();
                await open(`https://www.google.com/search?q=${encodeURIComponent(item.name + ' ' + item.package + ' android package info')}`);
              }}
            >
              <label className="pkg-label">
                <input
                  type="checkbox"
                  checked={selected.has(item.package)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(item.package); else next.delete(item.package);
                    setSelected(next);
                  }}
                  aria-label={`${item.name} (${item.package})`}
                />
                <div className="pkg-details">
                  <span className="pkg-name">{item.name}</span>
                  <span className="pkg-id">{item.package}</span>
                </div>
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

      <footer className="status" aria-live="polite">
        <div>{updateMsg}</div>
        <pre className="log">{status}</pre>
      </footer>
    </div>
  );
}

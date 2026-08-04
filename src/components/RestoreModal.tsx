import React from 'react';
import type { BackupEntry } from '../types';
import { getFriendlyName } from '../appNames';

type Props = {
  open: boolean;
  loading: boolean;
  backups: BackupEntry[];
  onCancel: () => void;
  onPickFolder: () => void;
  onSelect: (entry: BackupEntry) => void;
};

export function RestoreModal({ open, loading, backups, onCancel, onPickFolder, onSelect }: Props) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="restore-modal-title">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header><strong id="restore-modal-title">Select a backup to restore</strong></header>
        <div className="list">
          {loading && (
            <div className="loading" aria-live="polite">
              <div className="spinner" />
              <span>Loading backups…</span>
            </div>
          )}
          {!loading && backups.length === 0 && (
            <div className="muted">No backups found in the default folder.</div>
          )}
          {!loading && backups.map(b => {
            const friendlyName = getFriendlyName(b.package);
            return (
              <div
                key={`${b.package}-${b.timestamp}`}
                className="item"
                onClick={() => onSelect(b)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(b); } }}
                aria-label={`Restore backup for ${friendlyName} (${b.package}) created on ${new Date(b.timestamp * 1000).toLocaleString()}`}
              >
                <div className="row between">
                  <span className="pkg-name">{friendlyName}</span>
                  <small>{new Date(b.timestamp * 1000).toLocaleString()}</small>
                </div>
                <div className="muted small">{b.package} • {b.dir}</div>
              </div>
            );
          })}
        </div>
        <footer className="row between">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onPickFolder}>Pick Folder...</button>
        </footer>
      </div>
    </div>
  );
}

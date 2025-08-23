import React from 'react';
import type { BackupEntry } from '../types';

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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header><strong>Select a backup to restore</strong></header>
        <div className="list">
          {loading && (
            <div className="loading">
              <div className="spinner" />
              <span>Loading backups…</span>
            </div>
          )}
          {!loading && backups.length === 0 && (
            <div className="muted">No backups found in the default folder.</div>
          )}
          {!loading && backups.map(b => (
            <div key={`${b.package}-${b.timestamp}`} className="item" onClick={() => onSelect(b)}>
              <div className="row between">
                <span>{b.package}</span>
                <small>{new Date(b.timestamp * 1000).toLocaleString()}</small>
              </div>
              <div className="muted small">{b.dir}</div>
            </div>
          ))}
        </div>
        <footer className="row between">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onPickFolder}>Pick Folder...</button>
        </footer>
      </div>
    </div>
  );
}

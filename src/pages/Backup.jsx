import React, { useRef, useState } from 'react';

import { CompanyAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { Button, Card, PageHeader, ErrorText } from '../components/ui';
import Icon from '../components/Icon';
import { todayStr } from '../utils/format';
import styles from './Backup.module.css';

const RESTORE_LABELS = [
  { key: 'parties', label: 'Customers' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'payments', label: 'Payments' },
  { key: 'followups', label: 'Follow-ups' },
];

export default function Backup() {
  const fileRef = useRef(null);

  const [downloading, setDownloading] = useState(false);
  const [backupError, setBackupError] = useState(null);

  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState(null);
  const [restoreResult, setRestoreResult] = useState(null);

  async function onDownload() {
    setBackupError(null);
    setDownloading(true);
    try {
      const data = await CompanyAPI.backup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ughrani-backup-${todayStr()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setBackupError(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  async function onFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    // Reset the input so selecting the same file again re-triggers onChange.
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;

    setRestoreError(null);
    setRestoreResult(null);
    setRestoring(true);
    try {
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('Invalid backup file: could not read JSON.');
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid backup file: unexpected format.');
      }
      const result = await CompanyAPI.restore(parsed);
      setRestoreResult(result);
    } catch (err) {
      setRestoreError(getErrorMessage(err));
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Backup / Restore"
        subtitle="Download a snapshot of your data or restore from a previous backup"
      />

      <div className={styles.grid}>
        <Card title="Backup">
          <div className={styles.section}>
            <div className={styles.iconBadge}>
              <Icon name="backup" size={22} />
            </div>
            <p className={styles.lead}>
              Download a complete JSON snapshot of your company data — customers, invoices,
              payments and follow-ups. Keep it somewhere safe; you can use it later to restore.
            </p>
            <Button onClick={onDownload} loading={downloading}>
              <Icon name="backup" size={16} /> Download backup
            </Button>
            <ErrorText>{backupError}</ErrorText>
          </div>
        </Card>

        <Card title="Restore">
          <div className={styles.section}>
            <div className={styles.warning}>
              <Icon name="alert" size={18} />
              <span>
                Restore is <strong>additive</strong> — records from the backup are added to your
                existing data. Customers and items are matched by name to avoid duplicates. This
                does not delete anything.
              </span>
            </div>
            <p className={styles.lead}>
              Select a backup JSON file to restore its records into your account.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className={styles.fileInput}
              onChange={onFileSelected}
              disabled={restoring}
            />
            <Button
              variant="ghost"
              onClick={() => fileRef.current && fileRef.current.click()}
              loading={restoring}
            >
              <Icon name="backup" size={16} /> Choose backup file
            </Button>

            {restoreResult && (
              <div className={styles.success}>
                <p className={styles.successTitle}>Restore complete</p>
                <div className={styles.countGrid}>
                  {RESTORE_LABELS.map(({ key, label }) => (
                    <div key={key} className={styles.countBox}>
                      <div className={styles.countValue}>{restoreResult[key] ?? 0}</div>
                      <div className={styles.countLabel}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <ErrorText>{restoreError}</ErrorText>
          </div>
        </Card>
      </div>
    </div>
  );
}

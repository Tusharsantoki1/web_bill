import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ReportAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import {
  Button, Card, DataTable, Badge, PageHeader, Spinner, ErrorText,
} from '../components/ui';
import Icon from '../components/Icon';
import { money, fmtDate, MODE_LABEL } from '../utils/format';
import styles from './Reports.module.css';

const NAV = [
  { label: 'Outstanding Report', desc: 'Party-wise outstanding & overdue', icon: 'rupee', to: '/outstanding', tone: 'blue' },
  { label: 'Aging Report', desc: 'Ageing buckets by party', icon: 'reports', to: '/aging', tone: 'purple' },
];

export default function Reports() {
  const navigate = useNavigate();

  // Section 1: Collection Report
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [collection, setCollection] = useState(null);
  const [collLoading, setCollLoading] = useState(true);
  const [collError, setCollError] = useState(null);

  // Section 2: Overdue Bills
  const [overdue, setOverdue] = useState(null);
  const [overdueLoading, setOverdueLoading] = useState(true);
  const [overdueError, setOverdueError] = useState(null);

  function loadCollection(f, t) {
    setCollLoading(true);
    setCollError(null);
    const params = {};
    if (f) params.from_date = f;
    if (t) params.to_date = t;
    ReportAPI.collection(params)
      .then(setCollection)
      .catch((err) => { setCollection(null); setCollError(getErrorMessage(err)); })
      .finally(() => setCollLoading(false));
  }

  function loadOverdue() {
    setOverdueLoading(true);
    setOverdueError(null);
    ReportAPI.overdue()
      .then(setOverdue)
      .catch((err) => { setOverdue(null); setOverdueError(getErrorMessage(err)); })
      .finally(() => setOverdueLoading(false));
  }

  useEffect(() => {
    loadCollection('', '');
    loadOverdue();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function onApply(e) {
    e.preventDefault();
    loadCollection(from, to);
  }

  const payments = collection?.payments || [];
  const bills = overdue?.bills || [];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Collection, overdue and other collection insights"
      />

      <div className={styles.navGrid}>
        {NAV.map((n) => (
          <button
            key={n.to}
            className={styles.navCard}
            onClick={() => navigate(n.to)}
          >
            <span className={`${styles.navIcon} ${styles[`nav_${n.tone}`]}`}>
              <Icon name={n.icon} size={22} />
            </span>
            <span className={styles.navText}>
              <span className={styles.navLabel}>{n.label}</span>
              <span className={styles.navDesc}>{n.desc}</span>
            </span>
            <Icon name="chevronRight" size={18} className={styles.navChevron} />
          </button>
        ))}
      </div>

      {/* Section 1: Collection Report */}
      <Card
        title="Collection Report"
        bodyClassName={styles.noPad}
      >
        <form className={styles.filterRow} onSubmit={onApply}>
          <label className={styles.filterField}>
            <span className={styles.filterLabel}>From</span>
            <input
              type="date"
              className={styles.dateInput}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className={styles.filterField}>
            <span className={styles.filterLabel}>To</span>
            <input
              type="date"
              className={styles.dateInput}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <Button type="submit" loading={collLoading}>Apply</Button>
        </form>

        {collection && !collLoading && (
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Collected</span>
              <span className={`${styles.summaryValue} ${styles.pos}`}>
                {money(collection.total_collected)}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Payments</span>
              <span className={styles.summaryValue}>{collection.count ?? payments.length}</span>
            </div>
          </div>
        )}

        {collError && <div className={styles.errorPad}><ErrorText>{collError}</ErrorText></div>}

        {collLoading ? (
          <Spinner text="Loading collection report…" />
        ) : (
          <DataTable
            columns={[
              { key: 'payment_date', label: 'Date', render: (r) => fmtDate(r.payment_date) },
              { key: 'party_name', label: 'Party', render: (r) => <strong>{r.party_name}</strong> },
              { key: 'amount', label: 'Amount', align: 'right', render: (r) => money(r.amount) },
              { key: 'mode', label: 'Mode', render: (r) => <Badge tone="info">{MODE_LABEL[r.mode] || r.mode}</Badge> },
              { key: 'reference_no', label: 'Ref', render: (r) => r.reference_no || '—' },
              { key: 'invoice_number', label: 'Bill', render: (r) => r.invoice_number || '—' },
            ]}
            rows={payments}
            rowKey={(r) => r.payment_id}
            empty="No collections in this period."
            footer={
              payments.length > 0 && (
                <tr>
                  <td>Total</td>
                  <td />
                  <td style={{ textAlign: 'right', color: 'var(--success)' }}>
                    {money(collection?.total_collected)}
                  </td>
                  <td /><td /><td />
                </tr>
              )
            }
          />
        )}
      </Card>

      {/* Section 2: Overdue Bills */}
      <Card
        title="Overdue Bills"
        bodyClassName={styles.noPad}
        className={styles.section}
      >
        {overdue && !overdueLoading && (
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Overdue</span>
              <span className={`${styles.summaryValue} ${styles.neg}`}>
                {money(overdue.total_overdue)}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Balance</span>
              <span className={styles.summaryValue}>{money(overdue.total_balance)}</span>
            </div>
          </div>
        )}

        {overdueError && <div className={styles.errorPad}><ErrorText>{overdueError}</ErrorText></div>}

        {overdueLoading ? (
          <Spinner text="Loading overdue bills…" />
        ) : (
          <DataTable
            columns={[
              { key: 'party_name', label: 'Party', render: (r) => <strong>{r.party_name}</strong> },
              { key: 'invoice_number', label: 'Bill', render: (r) => r.invoice_number || '—' },
              { key: 'due_date', label: 'Due', render: (r) => fmtDate(r.due_date) },
              {
                key: 'overdue_days',
                label: 'Overdue',
                render: (r) => <span className={styles.overdueDays}>{r.overdue_days}d</span>,
              },
              { key: 'balance', label: 'Balance', align: 'right', render: (r) => money(r.balance) },
            ]}
            rows={bills}
            rowKey={(r) => r.invoice_id}
            empty="No overdue bills."
            onRowClick={(r) => navigate(`/ledger/${r.party_id}`)}
          />
        )}
      </Card>
    </div>
  );
}

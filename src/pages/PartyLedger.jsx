import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ReportAPI, WhatsAppAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import {
  Button, Card, DataTable, PageHeader, Spinner, ErrorText,
} from '../components/ui';
import Icon from '../components/Icon';
import { money, fmtDate } from '../utils/format';
import styles from './PartyLedger.module.css';

export default function PartyLedger() {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [waLoading, setWaLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    ReportAPI.ledger(partyId)
      .then((data) => { if (active) setLedger(data); })
      .catch((err) => { if (active) setError(getErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [partyId]);

  async function onReminder() {
    setWaLoading(true);
    try {
      const res = await WhatsAppAPI.reminder(partyId);
      if (res?.wa_link) window.open(res.wa_link, '_blank', 'noopener');
      else alert(res?.message || 'No reminder available for this party.');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setWaLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Party Ledger" subtitle="Party ledger" />
        <Card><Spinner text="Loading ledger…" /></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Party Ledger" subtitle="Party ledger" />
        <Card><ErrorText>{error}</ErrorText></Card>
      </div>
    );
  }

  if (!ledger) return null;

  const entries = ledger.entries || [];

  return (
    <div>
      <PageHeader
        title={ledger.party_name}
        subtitle="Party ledger"
        actions={
          <div className={styles.headerActions}>
            <Button variant="ghost" loading={waLoading} onClick={onReminder}>
              <Icon name="whatsapp" size={16} /> WhatsApp Reminder
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/payment-entry?partyId=${partyId}`)}>
              <Icon name="payment" size={16} /> Add Payment
            </Button>
            <Button onClick={() => navigate('/followups')}>
              <Icon name="phone" size={16} /> Add Follow-up
            </Button>
          </div>
        }
      />

      <Card className={styles.summaryCard}>
        <div className={styles.stats}>
          <Stat label="Opening" value={money(ledger.opening_balance)} />
          <Stat label="Billed" value={money(ledger.total_billed)} />
          <Stat label="Paid" value={money(ledger.total_paid)} className={styles.paid} />
          <Stat label="Outstanding" value={money(ledger.outstanding)} className={styles.outstanding} />
        </div>
      </Card>

      <Card title="Transactions" bodyClassName={styles.noPad}>
        <DataTable
          columns={[
            { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
            { key: 'particulars', label: 'Particulars' },
            { key: 'ref', label: 'Ref', render: (r) => r.ref || '—' },
            {
              key: 'debit', label: 'Debit', align: 'right',
              render: (r) => (Number(r.debit) > 0 ? money(r.debit) : '—'),
            },
            {
              key: 'credit', label: 'Credit', align: 'right',
              render: (r) => (
                Number(r.credit) > 0
                  ? <span className={styles.creditCell}>{money(r.credit)}</span>
                  : '—'
              ),
            },
            {
              key: 'balance', label: 'Balance', align: 'right',
              render: (r) => <strong>{money(r.balance)}</strong>,
            },
          ]}
          rows={entries}
          rowKey={(r, i) => `${r.date}-${r.kind}-${r.ref || ''}-${i}`}
          empty="No transactions yet for this party."
        />
      </Card>
    </div>
  );
}

function Stat({ label, value, className = '' }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={`${styles.statValue} ${className}`}>{value}</div>
    </div>
  );
}

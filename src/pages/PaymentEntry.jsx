import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PartyAPI, InvoiceAPI, PaymentAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import {
  Button, Card, Field, Input, Textarea, Select, PageHeader, PartySelect,
  ErrorText, Spinner, Badge,
} from '../components/ui';
import Icon from '../components/Icon';
import { money, fmtDate, todayStr, MODE_LABEL } from '../utils/format';
import styles from './PaymentEntry.module.css';

const MODES = ['cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other'];

export default function PaymentEntry() {
  const [searchParams] = useSearchParams();
  const partyIdParam = searchParams.get('partyId');

  const [party, setParty] = useState(null);
  const [preloading, setPreloading] = useState(Boolean(partyIdParam));

  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billId, setBillId] = useState('');

  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayStr());
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);

  // Preload the party from ?partyId when present.
  useEffect(() => {
    if (!partyIdParam) return;
    let active = true;
    setPreloading(true);
    PartyAPI.get(partyIdParam)
      .then((p) => { if (active) setParty(p); })
      .catch(() => { if (active) setParty(null); })
      .finally(() => { if (active) setPreloading(false); });
    return () => { active = false; };
  }, [partyIdParam]);

  // Load unpaid bills whenever the selected party changes.
  useEffect(() => {
    setBillId('');
    if (!party) {
      setBills([]);
      return undefined;
    }
    let active = true;
    setBillsLoading(true);
    InvoiceAPI.list({ party_id: party.id })
      .then((data) => {
        if (!active) return;
        setBills((data || []).filter((b) => b.payment_status !== 'paid'));
      })
      .catch(() => { if (active) setBills([]); })
      .finally(() => { if (active) setBillsLoading(false); });
    return () => { active = false; };
  }, [party]);

  function onSelectParty(p) {
    setParty(p);
    setError(null);
    setSuccess(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!party) return setError('Please select a party');
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) return setError('Enter a valid amount');

    setSaving(true);
    try {
      await PaymentAPI.create({
        party_id: party.id,
        invoice_id: billId ? Number(billId) : null,
        amount: amt,
        mode,
        payment_date: paymentDate || undefined,
        reference_no: referenceNo || undefined,
        remarks: remarks || undefined,
      });
      // Reset the entry fields, keep party/mode/date for fast repeat entry.
      setAmount('');
      setReferenceNo('');
      setRemarks('');
      setBillId('');
      setSuccess(`Payment of ${money(amt)} recorded for ${party.name}.`);
      // Refresh unpaid bills so a now-settled bill drops off.
      InvoiceAPI.list({ party_id: party.id })
        .then((data) => setBills((data || []).filter((b) => b.payment_status !== 'paid')))
        .catch(() => {});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (preloading) {
    return (
      <div>
        <PageHeader title="Payment Entry" subtitle="Record a payment received from a party" />
        <Card><Spinner text="Loading party…" /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Payment Entry" subtitle="Record a payment received from a party" />

      <div className={styles.wrap}>
        <Card title="New Payment">
          <form onSubmit={onSubmit}>
            <Field label="Party *">
              <PartySelect value={party} onChange={onSelectParty} />
            </Field>

            <Field
              label="Apply to bill (optional)"
              hint={
                party && !billsLoading && bills.length === 0
                  ? 'No unpaid bills for this party. Payment will be recorded on account.'
                  : undefined
              }
            >
              <Select
                value={billId}
                onChange={(e) => setBillId(e.target.value)}
                disabled={!party || billsLoading}
              >
                <option value="">
                  {billsLoading ? 'Loading bills…' : 'On account (no bill)'}
                </option>
                {bills.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.invoice_number} · {fmtDate(b.invoice_date)} · Bal {money(Number(b.grand_total) - Number(b.amount_paid))}
                  </option>
                ))}
              </Select>
            </Field>

            <div className={styles.row2}>
              <Field label="Amount *">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Payment date">
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </Field>
            </div>

            <div className={styles.row2}>
              <Field label="Mode">
                <Select value={mode} onChange={(e) => setMode(e.target.value)}>
                  {MODES.map((m) => (
                    <option key={m} value={m}>{MODE_LABEL[m]}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Reference no.">
                <Input
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Cheque / UTR / txn ref"
                />
              </Field>
            </div>

            <Field label="Remarks">
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional note"
              />
            </Field>

            {success && (
              <p className={styles.success}>
                <Icon name="payment" size={16} /> {success}
              </p>
            )}
            <ErrorText>{error}</ErrorText>

            <div className={styles.formActions}>
              <Button type="submit" loading={saving} disabled={!party}>
                <Icon name="rupee" size={16} /> Record Payment
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Party Summary" bodyClassName={styles.summaryBody}>
          {!party ? (
            <p className={styles.hintText}>Select a party to see their details.</p>
          ) : (
            <div className={styles.summary}>
              <div className={styles.summaryName}>{party.name}</div>
              <div className={styles.summaryRow}>
                <span className={styles.k}>Phone</span>
                <span className={styles.v}>{party.phone || '—'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.k}>City</span>
                <span className={styles.v}>{party.city || '—'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.k}>Credit days</span>
                <span className={styles.v}>{party.credit_days || 0}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.k}>Unpaid bills</span>
                <span className={styles.v}>
                  {billsLoading ? '…' : <Badge tone={bills.length ? 'warning' : 'neutral'}>{bills.length}</Badge>}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

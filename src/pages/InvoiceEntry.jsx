import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { InvoiceAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import {
  Button, Card, Field, Input, Textarea, PageHeader, PartySelect, ErrorText,
} from '../components/ui';
import Icon from '../components/Icon';
import BillPreview from '../components/BillPreview';
import SubscriptionGate from '../components/SubscriptionGate';
import { useAuth } from '../auth/AuthContext';
import { money, todayStr } from '../utils/format';
import styles from './InvoiceEntry.module.css';

export default function InvoiceEntry() {
  const navigate = useNavigate();
  const { canCreateBills } = useAuth();
  const [party, setParty] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(todayStr());
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewId, setPreviewId] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Belt and braces: the form is not rendered without an active
    // subscription, and the backend returns 402 regardless.
    if (!canCreateBills) {
      return setError('Billing is disabled — your subscription is not active.');
    }
    if (!party) return setError('Please select a party');
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) return setError('Amount must be greater than 0');

    setSaving(true);
    try {
      const invoice = await InvoiceAPI.createOutstanding({
        party_id: party.id,
        invoice_number: invoiceNumber.trim() || undefined,
        invoice_date: invoiceDate || undefined,
        due_date: dueDate || undefined,
        amount: amt,
        remarks: remarks.trim() || undefined,
      });
      setSuccess(invoice);
      // Keep the party for quick repeat entry; reset amount/remarks/invoice number.
      setInvoiceNumber('');
      setAmount('');
      setRemarks('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Invoice Entry" subtitle="Record an outstanding bill" />

      {/* Renders an explanatory banner and hides the form when billing is
          unavailable, whether that is an expired plan or a read-only role. */}
      <SubscriptionGate />

      {canCreateBills && (
      <Card className={styles.formCard}>
        <form onSubmit={onSubmit}>
          {success && (
            <div className={styles.success}>
              <Icon name="invoice" size={18} />
              <span>
                Recorded <strong>{success.invoice_number}</strong> for {money(success.grand_total)}.
              </span>
              <button
                type="button"
                className={styles.successLink}
                onClick={() => setPreviewId(success.id)}
              >
                Preview bill
              </button>
              <button
                type="button"
                className={styles.successLink}
                onClick={() => navigate(`/ledger/${success.party_id}`)}
              >
                View ledger
              </button>
            </div>
          )}

          <Field label="Party *">
            <PartySelect value={party} onChange={(p) => { setParty(p); setSuccess(null); }} />
          </Field>

          <div className={styles.row2}>
            <Field label="Invoice number" hint="Auto-generated if left empty">
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Auto if empty"
              />
            </Field>
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
          </div>

          <div className={styles.row2}>
            <Field label="Invoice date">
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </Field>
            <Field label="Due date" hint="Auto from credit days if empty">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Remarks">
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes for this bill"
            />
          </Field>

          <ErrorText>{error}</ErrorText>

          <div className={styles.formActions}>
            <Button type="submit" loading={saving} disabled={!canCreateBills}>
              <Icon name="plus" size={16} /> Record Bill
            </Button>
          </div>
        </form>
      </Card>
      )}

      <BillPreview
        invoiceId={previewId}
        open={Boolean(previewId)}
        onClose={() => setPreviewId(null)}
      />
    </div>
  );
}

import React, { useEffect, useState } from 'react';

import { CompanyAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import {
  Button, Card, Field, Input, Textarea, PageHeader, Spinner, ErrorText,
} from '../components/ui';
import Icon from '../components/Icon';
import styles from './Settings.module.css';

const EMPTY = {
  name: '', invoice_prefix: '',
  address: '', city: '', state: '', state_code: '', pincode: '', gstin: '', pan: '',
  bank_name: '', bank_account_no: '', bank_ifsc: '', upi_number: '', default_note: '',
  default_credit_days: '', financial_year_start: '', financial_year_end: '',
};

function seed(c) {
  if (!c) return EMPTY;
  return {
    name: c.name || '',
    invoice_prefix: c.invoice_prefix || '',
    address: c.address || '',
    city: c.city || '',
    state: c.state || '',
    state_code: c.state_code || '',
    pincode: c.pincode || '',
    gstin: c.gstin || '',
    pan: c.pan || '',
    bank_name: c.bank_name || '',
    bank_account_no: c.bank_account_no || '',
    bank_ifsc: c.bank_ifsc || '',
    upi_number: c.upi_number || '',
    default_note: c.default_note || '',
    default_credit_days:
      c.default_credit_days || c.default_credit_days === 0 ? String(c.default_credit_days) : '',
    financial_year_start: c.financial_year_start || '',
    financial_year_end: c.financial_year_end || '',
  };
}

// Empty string -> undefined (so the API receives null/undefined, not "").
const orUndef = (v) => {
  const t = (v || '').trim();
  return t === '' ? undefined : t;
};

export default function Settings() {
  const { company, refreshCompany } = useAuth();
  const [form, setForm] = useState(() => seed(company));
  const [loading, setLoading] = useState(!company);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSuccess(false);
  };

  useEffect(() => {
    // Prefer the company from auth context; fall back to a direct fetch.
    if (company) {
      setForm(seed(company));
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    CompanyAPI.get()
      .then((c) => {
        if (alive) setForm(seed(c));
      })
      .catch((err) => {
        if (alive) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [company]);

  async function onSave(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim())) {
      return setError('Pincode must be a 6-digit number.');
    }

    setSaving(true);
    try {
      const payload = {
        address: orUndef(form.address),
        city: orUndef(form.city),
        state: orUndef(form.state),
        state_code: orUndef(form.state_code),
        pincode: orUndef(form.pincode),
        gstin: orUndef(form.gstin),
        pan: orUndef(form.pan),
        bank_name: orUndef(form.bank_name),
        bank_account_no: orUndef(form.bank_account_no),
        bank_ifsc: orUndef(form.bank_ifsc),
        upi_number: orUndef(form.upi_number),
        default_note: orUndef(form.default_note),
        default_credit_days:
          form.default_credit_days.trim() === '' ? undefined : Number(form.default_credit_days),
        financial_year_start: orUndef(form.financial_year_start),
        financial_year_end: orUndef(form.financial_year_end),
      };
      await CompanyAPI.update(payload);
      await refreshCompany();
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="Company profile and preferences" />
        <Card>
          <Spinner text="Loading company details…" />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Company profile and preferences"
        actions={
          <Button type="submit" form="settingsForm" loading={saving}>
            <Icon name="settings" size={16} /> Save changes
          </Button>
        }
      />

      <form id="settingsForm" onSubmit={onSave} className={styles.stack}>
        <Card title="Company Identity">
          <div className={styles.row2}>
            <Field label="Company name" hint="Set by the administrator">
              <Input value={form.name} disabled readOnly />
            </Field>
            <Field label="Invoice prefix" hint="Set by the administrator">
              <Input value={form.invoice_prefix} disabled readOnly />
            </Field>
          </div>
        </Card>

        <Card title="Company Details">
          <Field label="Address">
            <Textarea value={form.address} onChange={set('address')} rows={2} placeholder="Street, area, landmark" />
          </Field>
          <div className={styles.row2}>
            <Field label="City">
              <Input value={form.city} onChange={set('city')} placeholder="Rajkot" />
            </Field>
            <Field label="Pincode">
              <Input
                value={form.pincode}
                onChange={set('pincode')}
                placeholder="360001"
                inputMode="numeric"
                maxLength={6}
              />
            </Field>
          </div>
          <div className={styles.row2}>
            <Field label="State">
              <Input value={form.state} onChange={set('state')} placeholder="Gujarat" />
            </Field>
            <Field label="State code">
              <Input value={form.state_code} onChange={set('state_code')} placeholder="24" />
            </Field>
          </div>
          <div className={styles.row2}>
            <Field label="GSTIN">
              <Input value={form.gstin} onChange={set('gstin')} placeholder="24ABCDE1234F1Z5" />
            </Field>
            <Field label="PAN">
              <Input value={form.pan} onChange={set('pan')} placeholder="ABCDE1234F" />
            </Field>
          </div>
        </Card>

        <Card title="Bank & Payment">
          <div className={styles.row2}>
            <Field label="Bank name">
              <Input value={form.bank_name} onChange={set('bank_name')} placeholder="HDFC Bank" />
            </Field>
            <Field label="Account number">
              <Input value={form.bank_account_no} onChange={set('bank_account_no')} />
            </Field>
          </div>
          <div className={styles.row2}>
            <Field label="IFSC code">
              <Input value={form.bank_ifsc} onChange={set('bank_ifsc')} placeholder="HDFC0000123" />
            </Field>
            <Field label="UPI number">
              <Input value={form.upi_number} onChange={set('upi_number')} placeholder="9876543210" />
            </Field>
          </div>
          <Field label="Default invoice note" hint="Shown on invoices and reminders.">
            <Textarea
              value={form.default_note}
              onChange={set('default_note')}
              rows={3}
              placeholder="Thank you for your business."
            />
          </Field>
        </Card>

        <Card title="Financial Year & Credit">
          <div className={styles.row3}>
            <Field label="Default credit days">
              <Input
                type="number"
                min="0"
                value={form.default_credit_days}
                onChange={set('default_credit_days')}
                placeholder="30"
              />
            </Field>
            <Field label="Financial year start">
              <Input
                type="date"
                value={form.financial_year_start}
                onChange={set('financial_year_start')}
              />
            </Field>
            <Field label="Financial year end">
              <Input
                type="date"
                value={form.financial_year_end}
                onChange={set('financial_year_end')}
              />
            </Field>
          </div>
        </Card>

        <div className={styles.footer}>
          <ErrorText>{error}</ErrorText>
          {success && !error && (
            <span className={styles.success}>
              <Icon name="book" size={16} /> Settings saved successfully.
            </span>
          )}
          <div className={styles.spacer} />
          <Button type="submit" loading={saving}>Save changes</Button>
        </div>
      </form>
    </div>
  );
}

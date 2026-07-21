import React, { useEffect, useRef, useState } from 'react';

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
  bank_name: '', bank_account_no: '', bank_ifsc: '', upi_number: '', upi_id: '', default_note: '',
  default_credit_days: '', financial_year_start: '', financial_year_end: '',
};

const BRANDING_SLOTS = [
  { key: 'logo_base64', label: 'Logo', hint: 'Printed on the invoice header.' },
  { key: 'payment_qr_base64', label: 'Payment QR', hint: 'Customers scan this to pay.' },
  { key: 'signature_base64', label: 'Signature', hint: 'Printed above the signatory line.' },
  { key: 'stamp_base64', label: 'Stamp', hint: 'Company seal printed on the bill.' },
];

const EMPTY_BRANDING = {
  logo_base64: '', payment_qr_base64: '', signature_base64: '', stamp_base64: '',
};

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

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
    upi_id: c.upi_id || '',
    default_note: c.default_note || '',
    default_credit_days:
      c.default_credit_days || c.default_credit_days === 0 ? String(c.default_credit_days) : '',
    financial_year_start: c.financial_year_start || '',
    financial_year_end: c.financial_year_end || '',
  };
}

function seedBranding(c) {
  if (!c) return EMPTY_BRANDING;
  return {
    logo_base64: c.logo_base64 || '',
    payment_qr_base64: c.payment_qr_base64 || '',
    signature_base64: c.signature_base64 || '',
    stamp_base64: c.stamp_base64 || '',
  };
}

// Empty string -> undefined (so the API receives null/undefined, not "").
const orUndef = (v) => {
  const t = (v || '').trim();
  return t === '' ? undefined : t;
};

// Stored images may be a full data URI or bare base64 — <img> needs a URI.
const imgSrc = (v) => (v.startsWith('data:') ? v : `data:image/png;base64,${v}`);

const sizeMb = (bytes) => (bytes / 1024 / 1024).toFixed(1);

export default function Settings() {
  const { company, refreshCompany } = useAuth();
  const [form, setForm] = useState(() => seed(company));
  const [loading, setLoading] = useState(!company);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Branding saves separately from the profile, so it keeps its own state.
  // `brandingBase` is what the server holds, so we can send only what changed.
  const [branding, setBranding] = useState(() => seedBranding(company));
  const [brandingBase, setBrandingBase] = useState(() => seedBranding(company));
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingError, setBrandingError] = useState(null);
  const [brandingSuccess, setBrandingSuccess] = useState(false);
  const [slotErrors, setSlotErrors] = useState({});
  const fileRefs = useRef({});
  const brandingDirty = useRef(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSuccess(false);
  };

  useEffect(() => {
    // Don't stomp on images the user picked but hasn't saved yet.
    const applyBranding = (c) => {
      if (brandingDirty.current) return;
      const b = seedBranding(c);
      setBranding(b);
      setBrandingBase(b);
    };

    // Prefer the company from auth context; fall back to a direct fetch.
    if (company) {
      setForm(seed(company));
      applyBranding(company);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    CompanyAPI.get()
      .then((c) => {
        if (!alive) return;
        setForm(seed(c));
        applyBranding(c);
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
        upi_id: orUndef(form.upi_id),
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

  const onPickImage = (key) => (e) => {
    const file = e.target.files && e.target.files[0];
    // Reset the input so selecting the same file again re-triggers onChange.
    if (fileRefs.current[key]) fileRefs.current[key].value = '';
    if (!file) return;

    setBrandingSuccess(false);
    const fail = (msg) => setSlotErrors((s) => ({ ...s, [key]: msg }));

    if (!IMAGE_TYPES.includes(file.type)) {
      return fail('Unsupported format. Use a PNG, JPG, GIF or WebP image.');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return fail(`That image is ${sizeMb(file.size)} MB. Please use one under 2 MB.`);
    }

    const reader = new FileReader();
    reader.onload = () => {
      brandingDirty.current = true;
      setSlotErrors((s) => ({ ...s, [key]: null }));
      setBranding((b) => ({ ...b, [key]: String(reader.result) }));
    };
    reader.onerror = () => fail('Could not read that file. Please try another one.');
    reader.readAsDataURL(file);
  };

  const onRemoveImage = (key) => () => {
    brandingDirty.current = true;
    setBranding((b) => ({ ...b, [key]: '' }));
    setSlotErrors((s) => ({ ...s, [key]: null }));
    setBrandingSuccess(false);
  };

  const changedBrandingKeys = BRANDING_SLOTS
    .map(({ key }) => key)
    .filter((key) => branding[key] !== brandingBase[key]);

  async function onSaveBranding() {
    setBrandingError(null);
    setBrandingSuccess(false);
    setBrandingSaving(true);
    try {
      // Send only what changed; "" tells the API to clear that image.
      const payload = {};
      changedBrandingKeys.forEach((key) => {
        payload[key] = branding[key];
      });
      await CompanyAPI.updateBranding(payload);
      setBrandingBase(branding);
      brandingDirty.current = false;
      await refreshCompany();
      setBrandingSuccess(true);
    } catch (err) {
      setBrandingError(getErrorMessage(err));
    } finally {
      setBrandingSaving(false);
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
          <Field label="UPI ID" hint="The VPA printed under the payment QR on the bill.">
            <Input
              value={form.upi_id}
              onChange={set('upi_id')}
              placeholder="name@okhdfcbank"
              maxLength={100}
            />
          </Field>
          <Field label="Default invoice note" hint="Shown on invoices and reminders.">
            <Textarea
              value={form.default_note}
              onChange={set('default_note')}
              rows={3}
              placeholder="Thank you for your business."
            />
          </Field>
        </Card>

        <Card
          title="Branding & Payment QR"
          bodyClassName={styles.brandingBody}
          action={
            <Button
              size="sm"
              onClick={onSaveBranding}
              loading={brandingSaving}
              disabled={changedBrandingKeys.length === 0}
            >
              Save branding
            </Button>
          }
        >
          <div className={styles.slots}>
            {BRANDING_SLOTS.map(({ key, label, hint }) => (
              <div key={key} className={styles.slot}>
                <div className={styles.slotHead}>
                  <span className={styles.slotLabel}>{label}</span>
                  {branding[key] && (
                    <button type="button" className={styles.remove} onClick={onRemoveImage(key)}>
                      Remove
                    </button>
                  )}
                </div>

                <div className={styles.thumb}>
                  {branding[key] ? (
                    <img src={imgSrc(branding[key])} alt={label} className={styles.thumbImg} />
                  ) : (
                    <span className={styles.placeholder}>
                      <Icon name="image" size={16} /> No image
                    </span>
                  )}
                </div>

                <input
                  ref={(el) => { fileRefs.current[key] = el; }}
                  type="file"
                  accept={IMAGE_TYPES.join(',')}
                  className={styles.fileInput}
                  onChange={onPickImage(key)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileRefs.current[key] && fileRefs.current[key].click()}
                >
                  <Icon name="image" size={16} /> Choose file
                </Button>

                {slotErrors[key] ? (
                  <span className={styles.slotError}>{slotErrors[key]}</span>
                ) : (
                  <span className={styles.slotHint}>{hint}</span>
                )}
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <ErrorText>{brandingError}</ErrorText>
            {brandingSuccess && !brandingError && (
              <span className={styles.success}>
                <Icon name="book" size={16} /> Branding saved successfully.
              </span>
            )}
            <span className={styles.hint}>PNG, JPG, GIF or WebP · up to 2 MB each.</span>
          </div>
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

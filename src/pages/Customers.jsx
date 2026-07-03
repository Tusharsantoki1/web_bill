import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PartyAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import {
  Button, Card, DataTable, Field, Input, Modal, PageHeader, ErrorText, Badge,
} from '../components/ui';
import Icon from '../components/Icon';
import { money } from '../utils/format';
import styles from './Customers.module.css';

const EMPTY = {
  name: '', phone: '', email: '', address: '', city: '', state: '', state_code: '',
  gstin: '', credit_days: '', opening_balance: '',
};

export default function Customers() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function load(q) {
    setLoading(true);
    PartyAPI.list(q)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(search);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setEditId(null);
    setForm(EMPTY);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditId(p.id);
    setForm({
      name: p.name || '', phone: p.phone || '', email: p.email || '', address: p.address || '',
      city: p.city || '', state: p.state || '', state_code: p.state_code || '', gstin: p.gstin || '',
      credit_days: p.credit_days ? String(p.credit_days) : '',
      opening_balance: p.opening_balance ? String(p.opening_balance) : '',
    });
    setError(null);
    setModalOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError('Customer name is required');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        state_code: form.state_code || undefined,
        gstin: form.gstin || undefined,
        credit_days: form.credit_days ? Number(form.credit_days) : 0,
        opening_balance: form.opening_balance ? Number(form.opening_balance) : 0,
      };
      if (editId) await PartyAPI.update(editId, payload);
      else await PartyAPI.create(payload);
      setModalOpen(false);
      load(search);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!editId) return;
    if (!window.confirm('Delete this customer? This cannot be undone.')) return;
    try {
      await PartyAPI.remove(editId);
      setModalOpen(false);
      load(search);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage the parties you collect dues from"
        actions={<Button onClick={openAdd}><Icon name="plus" size={16} /> Add Customer</Button>}
      />

      <Card bodyClassName={styles.noPad}>
        <div className={styles.searchBar}>
          <Icon name="search" size={18} />
          <input
            className={styles.searchInput}
            placeholder="Search customers…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); load(e.target.value); }}
          />
        </div>
        <DataTable
          columns={[
            { key: 'name', label: 'Party Name', render: (r) => <strong>{r.name}</strong> },
            { key: 'phone', label: 'Mobile No.', render: (r) => r.phone || '—' },
            { key: 'city', label: 'City', render: (r) => r.city || '—' },
            { key: 'credit_days', label: 'Credit Days', align: 'center', render: (r) => `${r.credit_days || 0}` },
            { key: 'opening_balance', label: 'Opening Balance', align: 'right', render: (r) => money(r.opening_balance) },
            {
              key: 'actions', label: '', align: 'right', render: (r) => (
                <div className={styles.actions}>
                  <button className={styles.iconBtn} title="Ledger" onClick={(e) => { e.stopPropagation(); navigate(`/ledger/${r.id}`); }}>
                    <Icon name="book" size={16} />
                  </button>
                  <button className={styles.iconBtn} title="Edit" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
                    <Icon name="edit" size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          empty={loading ? 'Loading…' : 'No customers yet. Add your first one.'}
          onRowClick={(r) => navigate(`/ledger/${r.id}`)}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editId ? 'Edit Customer' : 'Add Customer'}
        onClose={() => setModalOpen(false)}
        width={560}
      >
        <form onSubmit={onSave}>
          <Field label="Party name *">
            <Input value={form.name} onChange={set('name')} placeholder="ABC Traders" />
          </Field>
          <div className={styles.row2}>
            <Field label="Mobile number"><Input value={form.phone} onChange={set('phone')} /></Field>
            <Field label="City"><Input value={form.city} onChange={set('city')} /></Field>
          </div>
          <div className={styles.row2}>
            <Field label="Credit days"><Input type="number" value={form.credit_days} onChange={set('credit_days')} placeholder="30" /></Field>
            <Field label="Opening balance"><Input type="number" value={form.opening_balance} onChange={set('opening_balance')} placeholder="0" /></Field>
          </div>
          <div className={styles.row2}>
            <Field label="State"><Input value={form.state} onChange={set('state')} /></Field>
            <Field label="State code"><Input value={form.state_code} onChange={set('state_code')} placeholder="24" /></Field>
          </div>
          <Field label="GSTIN"><Input value={form.gstin} onChange={set('gstin')} /></Field>
          <Field label="Address"><Input value={form.address} onChange={set('address')} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
          <ErrorText>{error}</ErrorText>
          <div className={styles.formActions}>
            {editId && <Button type="button" variant="danger" onClick={onDelete}>Delete</Button>}
            <div style={{ flex: 1 }} />
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editId ? 'Save changes' : 'Add customer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

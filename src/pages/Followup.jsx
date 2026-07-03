import React, { useEffect, useState } from 'react';

import { FollowupAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import {
  Button, Card, DataTable, Field, Textarea, Select, Modal, PageHeader, ErrorText, Badge, PartySelect,
} from '../components/ui';
import Icon from '../components/Icon';
import { fmtDate, todayStr } from '../utils/format';
import styles from './Followup.module.css';

const TYPE_LABEL = {
  call: 'Call',
  whatsapp: 'WhatsApp',
  visit: 'Visit',
  other: 'Other',
};

const EMPTY = {
  type: 'call',
  remarks: '',
  followup_date: todayStr(),
  next_followup_date: '',
  status: 'pending',
};

export default function Followup() {
  const [rows, setRows] = useState([]);
  const [view, setView] = useState('all'); // 'all' | 'due'
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [party, setParty] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function load(which) {
    setLoading(true);
    const req = which === 'due' ? FollowupAPI.due() : FollowupAPI.list();
    req
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(view);
  }, [view]);

  function openAdd() {
    setParty(null);
    setForm(EMPTY);
    setError(null);
    setModalOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    setError(null);
    if (!party) return setError('Please select a party');
    setSaving(true);
    try {
      await FollowupAPI.create({
        party_id: party.id,
        type: form.type,
        remarks: form.remarks || undefined,
        followup_date: form.followup_date || undefined,
        next_followup_date: form.next_followup_date || undefined,
        status: form.status,
      });
      setModalOpen(false);
      load(view);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(r) {
    if (!window.confirm('Delete this follow-up? This cannot be undone.')) return;
    try {
      await FollowupAPI.remove(r.id);
      load(view);
    } catch (err) {
      window.alert(getErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Follow-up"
        subtitle="Track calls, visits and reminders for your parties"
        actions={<Button onClick={openAdd}><Icon name="plus" size={16} /> Add Follow-up</Button>}
      />

      <Card bodyClassName={styles.noPad}>
        <div className={styles.toolbar}>
          <div className={styles.segment}>
            <button
              type="button"
              className={`${styles.segBtn} ${view === 'all' ? styles.segActive : ''}`}
              onClick={() => setView('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`${styles.segBtn} ${view === 'due' ? styles.segActive : ''}`}
              onClick={() => setView('due')}
            >
              Due Today
            </button>
          </div>
        </div>

        <DataTable
          columns={[
            { key: 'party_name', label: 'Party', render: (r) => <strong>{r.party_name || '—'}</strong> },
            {
              key: 'type', label: 'Type', render: (r) => (
                <Badge tone="info">{TYPE_LABEL[r.type] || 'Other'}</Badge>
              ),
            },
            { key: 'followup_date', label: 'Last Follow-up', render: (r) => fmtDate(r.followup_date) },
            {
              key: 'next_followup_date', label: 'Next Follow-up', render: (r) => (
                <span className={styles.nextDate}>{fmtDate(r.next_followup_date)}</span>
              ),
            },
            { key: 'remarks', label: 'Remark', render: (r) => r.remarks || '—' },
            {
              key: 'status', label: 'Status', render: (r) => (
                <Badge tone={r.status === 'pending' ? 'warning' : 'success'}>
                  {r.status === 'pending' ? 'Pending' : 'Done'}
                </Badge>
              ),
            },
            {
              key: 'actions', label: '', align: 'right', render: (r) => (
                <div className={styles.actions}>
                  <button
                    className={styles.iconBtn}
                    title="Delete"
                    onClick={(e) => { e.stopPropagation(); onDelete(r); }}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          empty={loading
            ? 'Loading…'
            : view === 'due'
              ? 'No follow-ups due today.'
              : 'No follow-ups yet. Add your first one.'}
        />
      </Card>

      <Modal
        open={modalOpen}
        title="Add Follow-up"
        onClose={() => setModalOpen(false)}
        width={520}
      >
        <form onSubmit={onSave}>
          <Field label="Party *">
            <PartySelect value={party} onChange={setParty} />
          </Field>
          <div className={styles.row2}>
            <Field label="Type">
              <Select value={form.type} onChange={set('type')}>
                <option value="call">Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="visit">Visit</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={set('status')}>
                <option value="pending">Pending</option>
                <option value="done">Done</option>
              </Select>
            </Field>
          </div>
          <div className={styles.row2}>
            <Field label="Follow-up date">
              <input
                type="date"
                className={styles.dateInput}
                value={form.followup_date}
                onChange={set('followup_date')}
              />
            </Field>
            <Field label="Next follow-up date">
              <input
                type="date"
                className={styles.dateInput}
                value={form.next_followup_date}
                onChange={set('next_followup_date')}
              />
            </Field>
          </div>
          <Field label="Remarks">
            <Textarea value={form.remarks} onChange={set('remarks')} placeholder="Discussed payment, promised by month-end…" />
          </Field>
          <ErrorText>{error}</ErrorText>
          <div className={styles.formActions}>
            <div style={{ flex: 1 }} />
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Add follow-up</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

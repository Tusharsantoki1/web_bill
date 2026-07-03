import React, { useEffect, useState } from 'react';

import { CompanyAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import {
  Button, Card, DataTable, Field, Input, Select, Modal, PageHeader, ErrorText, Badge,
} from '../components/ui';
import Icon from '../components/Icon';
import { ROLE_LABEL } from '../utils/format';
import styles from './UserManagement.module.css';

const ASSIGNABLE_ROLES = ['company_staff', 'collection_executive', 'viewer'];

const EMPTY = {
  full_name: '', email: '', password: '', phone: '', role: 'company_staff',
};

export default function UserManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add User modal
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [addError, setAddError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Change Role modal
  const [roleTarget, setRoleTarget] = useState(null); // staff row being edited
  const [roleValue, setRoleValue] = useState('company_staff');
  const [roleError, setRoleError] = useState(null);
  const [roleSaving, setRoleSaving] = useState(false);

  // per-row action in flight (enable/disable)
  const [busyId, setBusyId] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function load() {
    setLoading(true);
    CompanyAPI.listStaff()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setForm(EMPTY);
    setAddError(null);
    setAddOpen(true);
  }

  async function onAdd(e) {
    e.preventDefault();
    setAddError(null);
    if (!form.full_name.trim()) return setAddError('Full name is required');
    if (!form.email.trim()) return setAddError('Email is required');
    if (form.password.length < 8) return setAddError('Password must be at least 8 characters');
    setSaving(true);
    try {
      await CompanyAPI.addStaff({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone || undefined,
        role: form.role,
      });
      setAddOpen(false);
      load();
    } catch (err) {
      setAddError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openRole(staff) {
    setRoleTarget(staff);
    setRoleValue(ASSIGNABLE_ROLES.includes(staff.role) ? staff.role : 'company_staff');
    setRoleError(null);
  }

  async function onSaveRole(e) {
    e.preventDefault();
    if (!roleTarget) return;
    setRoleError(null);
    setRoleSaving(true);
    try {
      await CompanyAPI.updateStaff(roleTarget.id, { role: roleValue });
      setRoleTarget(null);
      load();
    } catch (err) {
      setRoleError(getErrorMessage(err));
    } finally {
      setRoleSaving(false);
    }
  }

  async function onToggleActive(staff) {
    setBusyId(staff.id);
    try {
      await CompanyAPI.setStaffActive(staff.id, !staff.is_active);
      load();
    } catch (err) {
      window.alert(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Add staff and control their roles and access"
        actions={<Button onClick={openAdd}><Icon name="plus" size={16} /> Add User</Button>}
      />

      <Card bodyClassName={styles.noPad}>
        <DataTable
          columns={[
            { key: 'full_name', label: 'Name', render: (r) => <strong>{r.full_name || '—'}</strong> },
            { key: 'email', label: 'Email', render: (r) => r.email || '—' },
            {
              key: 'role',
              label: 'Role',
              render: (r) => <Badge tone={r.role === 'company_admin' ? 'purple' : 'info'}>{ROLE_LABEL[r.role] || r.role}</Badge>,
            },
            {
              key: 'status',
              label: 'Status',
              align: 'center',
              render: (r) => (
                <Badge tone={r.is_active ? 'success' : 'danger'}>{r.is_active ? 'Active' : 'Disabled'}</Badge>
              ),
            },
            {
              key: 'actions',
              label: '',
              align: 'right',
              render: (r) => {
                if (r.role === 'company_admin') {
                  return <span className={styles.adminNote}>Administrator</span>;
                }
                return (
                  <div className={styles.actions}>
                    <Button size="sm" variant="ghost" onClick={() => openRole(r)}>Role</Button>
                    <Button
                      size="sm"
                      variant={r.is_active ? 'danger' : 'primary'}
                      loading={busyId === r.id}
                      onClick={() => onToggleActive(r)}
                    >
                      {r.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                );
              },
            },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          empty={loading ? 'Loading…' : 'No users yet. Add your first staff member.'}
        />
      </Card>

      {/* Add User */}
      <Modal
        open={addOpen}
        title="Add User"
        onClose={() => setAddOpen(false)}
        width={520}
      >
        <form onSubmit={onAdd}>
          <Field label="Full name *">
            <Input value={form.full_name} onChange={set('full_name')} placeholder="Ramesh Patel" />
          </Field>
          <Field label="Email *">
            <Input type="email" value={form.email} onChange={set('email')} placeholder="ramesh@example.com" />
          </Field>
          <div className={styles.row2}>
            <Field label="Password *" hint="Minimum 8 characters">
              <Input type="password" value={form.password} onChange={set('password')} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={set('phone')} />
            </Field>
          </div>
          <Field label="Role">
            <Select value={form.role} onChange={set('role')}>
              {ASSIGNABLE_ROLES.map((role) => (
                <option key={role} value={role}>{ROLE_LABEL[role]}</option>
              ))}
            </Select>
          </Field>
          <ErrorText>{addError}</ErrorText>
          <div className={styles.formActions}>
            <div style={{ flex: 1 }} />
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Add user</Button>
          </div>
        </form>
      </Modal>

      {/* Change Role */}
      <Modal
        open={!!roleTarget}
        title="Change Role"
        onClose={() => setRoleTarget(null)}
        width={440}
      >
        <form onSubmit={onSaveRole}>
          {roleTarget && (
            <p className={styles.roleSubject}>
              Set the role for <strong>{roleTarget.full_name || roleTarget.email}</strong>.
            </p>
          )}
          <Field label="Role">
            <Select value={roleValue} onChange={(e) => setRoleValue(e.target.value)}>
              {ASSIGNABLE_ROLES.map((role) => (
                <option key={role} value={role}>{ROLE_LABEL[role]}</option>
              ))}
            </Select>
          </Field>
          <ErrorText>{roleError}</ErrorText>
          <div className={styles.formActions}>
            <div style={{ flex: 1 }} />
            <Button type="button" variant="ghost" onClick={() => setRoleTarget(null)}>Cancel</Button>
            <Button type="submit" loading={roleSaving}>Save role</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

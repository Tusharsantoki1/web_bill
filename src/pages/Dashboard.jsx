import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ReportAPI } from '../api/endpoints';
import { Card, DataTable, KpiCard, Badge } from '../components/ui';
import Icon from '../components/Icon';
import { money, moneyShort, fmtDate, MODE_LABEL } from '../utils/format';
import styles from './Dashboard.module.css';

const QUICK = [
  { label: 'Add Customer', icon: 'customers', to: '/customers', tone: 'blue' },
  { label: 'Invoice Entry', icon: 'invoice', to: '/invoice-entry', tone: 'green' },
  { label: 'Payment Entry', icon: 'payment', to: '/payment-entry', tone: 'purple' },
  { label: 'Outstanding Report', icon: 'rupee', to: '/outstanding', tone: 'amber' },
  { label: 'WhatsApp Message', icon: 'whatsapp', to: '/whatsapp', tone: 'green' },
  { label: 'Follow-up Entry', icon: 'phone', to: '/followups', tone: 'red' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    ReportAPI.dashboard().then(setData).catch(() => {});
  }, []);

  const k = data?.kpis || {};
  const overdue = data?.overdue_parties || [];
  const collections = data?.recent_collections || [];
  const aging = data?.aging_summary || {};
  const followups = data?.followup_today || [];

  const overdueTotal = overdue.reduce((s, p) => s + Number(p.outstanding), 0);
  const collectionTotal = collections.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div>
      <div className={styles.kpis}>
        <KpiCard label="Total Outstanding" value={moneyShort(k.total_outstanding)} subtitle="All Party Outstanding" tone="blue" icon={<Icon name="rupee" size={22} />} />
        <KpiCard label="Collection Today" value={moneyShort(k.today_collection)} subtitle="Today Received" tone="green" icon={<Icon name="payment" size={22} />} />
        <KpiCard label="Today Due" value={moneyShort(k.today_due)} subtitle="Due Today" tone="amber" icon={<Icon name="calendar" size={22} />} />
        <KpiCard label="Overdue Amount" value={moneyShort(k.total_overdue)} subtitle="Overdue Outstanding" tone="red" icon={<Icon name="alert" size={22} />} />
        <KpiCard label="Total Parties" value={k.total_parties ?? 0} subtitle="Active Parties" tone="purple" icon={<Icon name="customers" size={22} />} />
      </div>

      <div className={styles.grid2}>
        <Card title="Overdue Parties (Top 5)" action={<button className={styles.viewAll} onClick={() => navigate('/outstanding')}>View All</button>} bodyClassName={styles.noPad}>
          <DataTable
            columns={[
              { key: 'party_name', label: 'Party Name' },
              { key: 'overdue_days', label: 'Overdue Days', render: (r) => <span className={styles.overdueDays}>{r.overdue_days} Days</span> },
              { key: 'outstanding', label: 'Outstanding Amount', align: 'right', render: (r) => money(r.outstanding) },
            ]}
            rows={overdue}
            rowKey={(r) => r.party_id}
            empty="No overdue parties."
            onRowClick={(r) => navigate(`/ledger/${r.party_id}`)}
            footer={
              overdue.length > 0 && (
                <tr>
                  <td>Total</td>
                  <td />
                  <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{money(overdueTotal)}</td>
                </tr>
              )
            }
          />
        </Card>

        <Card title="Recent Collections" action={<button className={styles.viewAll} onClick={() => navigate('/reports')}>View All</button>} bodyClassName={styles.noPad}>
          <DataTable
            columns={[
              { key: 'party_name', label: 'Party Name' },
              { key: 'payment_date', label: 'Date', render: (r) => fmtDate(r.payment_date) },
              { key: 'amount', label: 'Amount', align: 'right', render: (r) => money(r.amount) },
              { key: 'mode', label: 'Mode', render: (r) => <Badge tone="info">{MODE_LABEL[r.mode] || r.mode}</Badge> },
            ]}
            rows={collections}
            rowKey={(r) => r.payment_id}
            empty="No collections yet."
            footer={
              collections.length > 0 && (
                <tr>
                  <td>Total Collection</td>
                  <td /><td style={{ textAlign: 'right', color: 'var(--success)' }}>{money(collectionTotal)}</td>
                  <td />
                </tr>
              )
            }
          />
        </Card>
      </div>

      <div className={styles.grid2}>
        <div className={styles.stack}>
          <Card title="Outstanding Aging Summary">
            <div className={styles.aging}>
              <AgingBox label="0 - 30 Days" value={aging.b_0_30} tone="blue" />
              <AgingBox label="31 - 60 Days" value={aging.b_31_60} tone="amber" />
              <AgingBox label="61 - 90 Days" value={aging.b_61_90} tone="orange" />
              <AgingBox label="Above 90 Days" value={aging.b_90_plus} tone="red" />
            </div>
          </Card>

          <Card title="Follow-up Today" action={<button className={styles.viewAll} onClick={() => navigate('/followups')}>View All</button>} bodyClassName={styles.noPad}>
            <DataTable
              columns={[
                { key: 'party_name', label: 'Party Name' },
                { key: 'followup_date', label: 'Last Follow-up', render: (r) => fmtDate(r.followup_date) },
                { key: 'next_followup_date', label: 'Next Follow-up', render: (r) => <span className={styles.overdueDays}>{fmtDate(r.next_followup_date)}</span> },
                { key: 'remarks', label: 'Remark', render: (r) => r.remarks || '—' },
              ]}
              rows={followups}
              rowKey={(r) => r.id}
              empty="No follow-ups due today."
            />
          </Card>
        </div>

        <Card title="Quick Actions">
          <div className={styles.quick}>
            {QUICK.map((q) => (
              <button key={q.label} className={styles.quickBtn} onClick={() => navigate(q.to)}>
                <span className={`${styles.quickIcon} ${styles[`q_${q.tone}`]}`}>
                  <Icon name={q.icon} size={22} />
                </span>
                <span className={styles.quickLabel}>{q.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AgingBox({ label, value, tone }) {
  return (
    <div className={`${styles.agingBox} ${styles[`age_${tone}`]}`}>
      <div className={styles.agingLabel}>{label}</div>
      <div className={styles.agingValue}>{money(value)}</div>
    </div>
  );
}

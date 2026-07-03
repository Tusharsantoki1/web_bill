import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ReportAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import {
  Card, DataTable, PageHeader, Spinner, ErrorText,
} from '../components/ui';
import { money } from '../utils/format';
import styles from './AgingReport.module.css';

const BUCKETS = [
  { key: 'not_due', label: 'Not Due', tone: 'blue' },
  { key: 'd1_30', label: '1 - 30 Days', tone: 'green' },
  { key: 'd31_60', label: '31 - 60 Days', tone: 'amber' },
  { key: 'd61_90', label: '61 - 90 Days', tone: 'orange' },
  { key: 'd91_120', label: '91 - 120 Days', tone: 'red' },
  { key: 'd120_plus', label: '120+ Days', tone: 'red' },
];

export default function AgingReport() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    ReportAPI.aging()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const totals = data?.totals || {};
  const parties = data?.parties || [];

  const columns = [
    { key: 'party_name', label: 'Party Name', render: (r) => <strong>{r.party_name}</strong> },
    ...BUCKETS.map((b) => ({
      key: b.key,
      label: b.label,
      align: 'right',
      render: (r) =>
        b.key === 'd120_plus' && Number(r.d120_plus) > 0 ? (
          <span className={styles.danger}>{money(r.d120_plus)}</span>
        ) : (
          money(r[b.key])
        ),
    })),
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (r) => <strong>{money(r.total)}</strong>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Aging Report"
        subtitle="Outstanding split by how long each bill has been due"
      />

      {loading ? (
        <Card><Spinner text="Loading aging report…" /></Card>
      ) : error ? (
        <Card><ErrorText>{error}</ErrorText></Card>
      ) : (
        <>
          <Card title="Aging Summary">
            <div className={styles.summaryGrid}>
              {BUCKETS.map((b) => (
                <div key={b.key} className={`${styles.statBox} ${styles[`tone_${b.tone}`]}`}>
                  <div className={styles.statLabel}>{b.label}</div>
                  <div className={styles.statValue}>{money(totals[b.key])}</div>
                </div>
              ))}
            </div>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total Outstanding</span>
              <span className={styles.totalValue}>{money(totals.total)}</span>
            </div>
          </Card>

          <Card title="By Party" bodyClassName={styles.noPad}>
            <DataTable
              columns={columns}
              rows={parties}
              rowKey={(r) => r.party_id}
              empty="No outstanding parties."
              onRowClick={(r) => navigate(`/ledger/${r.party_id}`)}
              footer={
                parties.length > 0 && (
                  <tr>
                    <td><strong>Total</strong></td>
                    {BUCKETS.map((b) => (
                      <td key={b.key} style={{ textAlign: 'right' }}>
                        <strong className={b.key === 'd120_plus' && Number(totals.d120_plus) > 0 ? styles.danger : undefined}>
                          {money(totals[b.key])}
                        </strong>
                      </td>
                    ))}
                    <td style={{ textAlign: 'right' }}><strong>{money(totals.total)}</strong></td>
                  </tr>
                )
              }
            />
          </Card>
        </>
      )}
    </div>
  );
}

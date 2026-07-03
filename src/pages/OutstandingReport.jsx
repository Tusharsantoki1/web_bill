import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ReportAPI, WhatsAppAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import {
  Card, DataTable, KpiCard, PageHeader, Spinner, ErrorText,
} from '../components/ui';
import Icon from '../components/Icon';
import { money } from '../utils/format';
import styles from './OutstandingReport.module.css';

export default function OutstandingReport() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    ReportAPI.outstanding()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function onWhatsApp(partyId) {
    try {
      const res = await WhatsAppAPI.reminder(partyId);
      if (res?.wa_link) window.open(res.wa_link, '_blank');
      else if (res?.message) window.alert(res.message);
    } catch (err) {
      window.alert(getErrorMessage(err));
    }
  }

  const parties = data?.parties || [];

  return (
    <div>
      <PageHeader
        title="Outstanding Report"
        subtitle="Party-wise outstanding and overdue balances"
      />

      <div className={styles.kpis}>
        <KpiCard
          label="Total Outstanding"
          value={money(data?.total_outstanding)}
          subtitle="All Party Outstanding"
          tone="red"
          icon={<Icon name="rupee" size={22} />}
        />
        <KpiCard
          label="Total Overdue"
          value={money(data?.total_overdue)}
          subtitle="Overdue Outstanding"
          tone="amber"
          icon={<Icon name="alert" size={22} />}
        />
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      <Card bodyClassName={styles.noPad}>
        {loading ? (
          <Spinner text="Loading outstanding report…" />
        ) : (
          <DataTable
            columns={[
              { key: 'party_name', label: 'Party Name', render: (r) => <strong>{r.party_name}</strong> },
              { key: 'phone', label: 'Mobile No.', render: (r) => r.phone || '—' },
              { key: 'city', label: 'City', render: (r) => r.city || '—' },
              { key: 'outstanding', label: 'Outstanding', align: 'right', render: (r) => money(r.outstanding) },
              {
                key: 'overdue',
                label: 'Overdue',
                align: 'right',
                render: (r) => (
                  <span className={Number(r.overdue) > 0 ? styles.overdue : undefined}>
                    {money(r.overdue)}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: '',
                align: 'right',
                render: (r) => (
                  <div className={styles.actions}>
                    <button
                      className={styles.iconBtn}
                      title="Ledger"
                      onClick={(e) => { e.stopPropagation(); navigate(`/ledger/${r.party_id}`); }}
                    >
                      <Icon name="book" size={16} />
                    </button>
                    <button
                      className={styles.iconBtn}
                      title="Send WhatsApp reminder"
                      onClick={(e) => { e.stopPropagation(); onWhatsApp(r.party_id); }}
                    >
                      <Icon name="whatsapp" size={16} />
                    </button>
                  </div>
                ),
              },
            ]}
            rows={parties}
            rowKey={(r) => r.party_id}
            empty="No outstanding parties."
            onRowClick={(r) => navigate(`/ledger/${r.party_id}`)}
          />
        )}
      </Card>
    </div>
  );
}

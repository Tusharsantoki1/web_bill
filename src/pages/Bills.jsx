import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { InvoiceAPI } from '../api/endpoints';
import { getErrorMessage, getErrorMessageAsync } from '../api/client';
import {
  Badge, Button, Card, DataTable, Field, Input, Select, PageHeader, Spinner, ErrorText,
} from '../components/ui';
import Icon from '../components/Icon';
import BillPreview from '../components/BillPreview';
import { SubscriptionBadge } from '../components/SubscriptionGate';
import { useAuth } from '../auth/AuthContext';
import { money } from '../utils/format';
import styles from './Bills.module.css';

const PAGE_SIZE = 50;

const STATUS_TONE = { paid: 'success', partial: 'warning', pending: 'danger' };
const STATUS_LABEL = { paid: 'Paid', partial: 'Partial', pending: 'Pending' };
const DOC_LABEL = {
  invoice: 'Tax Invoice',
  debit_memo: 'Debit Memo',
  credit_memo: 'Credit Memo',
};

function formatDate(value) {
  if (!value) return '—';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

export default function Bills() {
  const navigate = useNavigate();
  const { canCreateBills } = useAuth();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback((term, paymentStatus, pageIndex) => {
    setLoading(true);
    setError(null);
    return InvoiceAPI.list({
      search: term || undefined,
      payment_status: paymentStatus || undefined,
      skip: pageIndex * PAGE_SIZE,
      limit: PAGE_SIZE,
    })
      .then((data) => setRows(data || []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // Debounced so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => load(search, status, page), 300);
    return () => clearTimeout(t);
  }, [search, status, page, load]);

  // Any filter change puts us back on the first page.
  useEffect(() => {
    setPage(0);
  }, [search, status]);

  async function onDownload(invoice) {
    setDownloadingId(invoice.id);
    setError(null);
    let url;
    try {
      url = await InvoiceAPI.pdfObjectUrl(invoice.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoice_number.replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      // Fetched as a blob, so the error body needs unpacking first.
      setError(await getErrorMessageAsync(err));
    } finally {
      if (url) setTimeout(() => URL.revokeObjectURL(url), 10000);
      setDownloadingId(null);
    }
  }

  const columns = [
    {
      key: 'invoice_number',
      label: 'Bill No.',
      render: (r) => <strong>{r.invoice_number}</strong>,
    },
    {
      key: 'party_name',
      label: 'Party',
      render: (r) => r.party_name || `#${r.party_id}`,
    },
    {
      key: 'document_type',
      label: 'Type',
      render: (r) => <span className={styles.docType}>{DOC_LABEL[r.document_type] || r.document_type}</span>,
    },
    { key: 'invoice_date', label: 'Date', render: (r) => formatDate(r.invoice_date) },
    { key: 'due_date', label: 'Due', render: (r) => formatDate(r.due_date) },
    { key: 'grand_total', label: 'Amount', align: 'right', render: (r) => money(r.grand_total) },
    {
      key: 'balance',
      label: 'Balance',
      align: 'right',
      render: (r) => {
        const balance = Number(r.grand_total) - Number(r.amount_paid);
        return (
          <span className={balance > 0 ? styles.due : undefined}>{money(balance)}</span>
        );
      },
    },
    {
      key: 'payment_status',
      label: 'Status',
      render: (r) => (
        <Badge tone={STATUS_TONE[r.payment_status]}>
          {STATUS_LABEL[r.payment_status] || r.payment_status}
        </Badge>
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
            title="Preview bill"
            onClick={(e) => { e.stopPropagation(); setPreviewId(r.id); }}
          >
            <Icon name="eye" size={16} />
          </button>
          <button
            className={styles.iconBtn}
            title="Download PDF"
            disabled={downloadingId === r.id}
            onClick={(e) => { e.stopPropagation(); onDownload(r); }}
          >
            <Icon name="download" size={16} />
          </button>
          <button
            className={styles.iconBtn}
            title="Party ledger"
            onClick={(e) => { e.stopPropagation(); navigate(`/ledger/${r.party_id}`); }}
          >
            <Icon name="book" size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bills"
        subtitle="All generated bills — preview, download or open the party ledger"
        actions={
          <div className={styles.headerActions}>
            <SubscriptionBadge />
            {/* Viewing past bills stays available without a subscription —
                only creating new ones is gated. */}
            <Button
              onClick={() => navigate('/invoice-entry')}
              disabled={!canCreateBills}
              title={canCreateBills ? undefined : 'Requires an active subscription'}
            >
              <Icon name="plus" size={16} /> New Bill
            </Button>
          </div>
        }
      />

      <Card>
        <div className={styles.filters}>
          <Field label="Search" hint="Bill number or party name">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. EH/22 or Sahyog"
            />
          </Field>
          <Field label="Payment status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </Select>
          </Field>
        </div>
      </Card>

      {error && <ErrorText>{error}</ErrorText>}

      <Card bodyClassName={styles.noPad}>
        {loading ? (
          <Spinner text="Loading bills…" />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            empty={
              search || status
                ? 'No bills match this filter.'
                : 'No bills yet. Create one from Invoice Entry.'
            }
            onRowClick={(r) => setPreviewId(r.id)}
          />
        )}
      </Card>

      {/* The API returns a plain page of rows with no total count, so paging is
          driven by whether this page came back full. */}
      {!loading && (page > 0 || rows.length === PAGE_SIZE) && (
        <div className={styles.pager}>
          <Button
            variant="secondary"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className={styles.pageInfo}>Page {page + 1}</span>
          <Button
            variant="secondary"
            disabled={rows.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <BillPreview
        invoiceId={previewId}
        open={Boolean(previewId)}
        onClose={() => setPreviewId(null)}
      />
    </div>
  );
}

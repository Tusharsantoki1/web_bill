import React, { useEffect, useRef, useState } from 'react';

import { InvoiceAPI } from '../api/endpoints';
import { getErrorMessage, getErrorMessageAsync } from '../api/client';
import { Button, Modal, Spinner, ErrorText } from './ui';
import Icon from './Icon';
import styles from './BillPreview.module.css';

/**
 * Shows the server-rendered bill and offers print / download.
 *
 * The preview HTML and the PDF come from the same backend template, so what is
 * on screen is what gets printed. It is dropped into an iframe via srcDoc so
 * the bill's own stylesheet cannot leak into the app's styles.
 */
export default function BillPreview({ invoiceId, open, onClose }) {
  const [html, setHtml] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!open || !invoiceId) return undefined;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setHtml(null);

    InvoiceAPI.previewHtml(invoiceId)
      .then((markup) => {
        if (!cancelled) setHtml(markup);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, invoiceId]);

  function onPrint() {
    const frame = frameRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.focus();
    frame.contentWindow.print();
  }

  async function onDownload() {
    setDownloading(true);
    setError(null);
    let url;
    try {
      url = await InvoiceAPI.pdfObjectUrl(invoiceId);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      // The PDF is fetched as a blob, so the error body needs unpacking.
      setError(await getErrorMessageAsync(err));
    } finally {
      // Revoke on a delay so the download has already started.
      if (url) setTimeout(() => URL.revokeObjectURL(url), 10000);
      setDownloading(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Bill Preview"
      onClose={onClose}
      width={980}
      footer={
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="secondary" onClick={onPrint} disabled={!html}>
            <Icon name="print" size={16} /> Print
          </Button>
          <Button onClick={onDownload} loading={downloading} disabled={!html}>
            <Icon name="download" size={16} /> Download PDF
          </Button>
        </div>
      }
    >
      {loading && <Spinner text="Rendering bill…" />}

      {!loading && error && <ErrorText>{error}</ErrorText>}

      {!loading && html && (
        <div className={styles.sheetWrap}>
          <iframe
            ref={frameRef}
            className={styles.frame}
            srcDoc={html}
            title="Bill preview"
          />
        </div>
      )}
    </Modal>
  );
}

import React, { useState } from 'react';

import { WhatsAppAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import {
  Button, Card, Field, Textarea, PageHeader, PartySelect, Spinner, EmptyState, ErrorText,
} from '../components/ui';
import Icon from '../components/Icon';
import { money } from '../utils/format';
import styles from './WhatsApp.module.css';

export default function WhatsApp() {
  const [party, setParty] = useState(null);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function onPickParty(p) {
    setParty(p);
    setData(null);
    setMessage('');
    setError(null);
    if (!p) return;
    setLoading(true);
    try {
      const res = await WhatsAppAPI.reminder(p.id);
      setData(res);
      setMessage(res.message || '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Build the wa.me link from the (possibly edited) message by swapping the
  // text query on the server-provided wa_link.
  function buildLink() {
    if (!data?.wa_link) return null;
    const encoded = encodeURIComponent(message);
    try {
      const url = new URL(data.wa_link);
      url.searchParams.set('text', encoded);
      return url.toString();
    } catch {
      // Fallback for non-absolute links: replace an existing text= query.
      if (data.wa_link.includes('text=')) {
        return data.wa_link.replace(/text=[^&]*/, `text=${encoded}`);
      }
      return `${data.wa_link}${data.wa_link.includes('?') ? '&' : '?'}text=${encoded}`;
    }
  }

  function onSend() {
    const link = buildLink();
    if (!link) return;
    window.open(link, '_blank');
  }

  const canSend = Boolean(data?.wa_link) && message.trim().length > 0;

  return (
    <div>
      <PageHeader title="WhatsApp Message" subtitle="Send an outstanding reminder" />

      <div className={styles.grid}>
        <Card title="Select Party">
          <Field label="Party">
            <PartySelect value={party} onChange={onPickParty} />
          </Field>

          {loading && <Spinner text="Loading reminder…" />}

          {!loading && error && <ErrorText>{error}</ErrorText>}

          {!loading && !error && data && (
            <div className={styles.details}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Party</span>
                <span className={styles.detailValue}>{data.party_name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Mobile No.</span>
                <span className={styles.detailValue}>
                  {data.phone ? (
                    <span className={styles.phone}>
                      <Icon name="phone" size={14} /> {data.phone}
                    </span>
                  ) : (
                    <span className={styles.noPhone}>No valid phone number</span>
                  )}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Outstanding</span>
                <span className={styles.outstanding}>{money(data.outstanding)}</span>
              </div>
            </div>
          )}

          {!loading && !error && !data && (
            <EmptyState
              title="No party selected"
              subtitle="Pick a party to load its outstanding reminder message."
            />
          )}
        </Card>

        <Card title="Message Preview">
          {!data ? (
            <EmptyState
              title="Nothing to preview"
              subtitle="The reminder message will appear here once a party is selected."
            />
          ) : (
            <div className={styles.preview}>
              <div className={styles.chat}>
                <div className={styles.bubble}>
                  <span className={styles.bubbleText}>{message || 'Your message is empty…'}</span>
                  <span className={styles.bubbleMeta}>
                    <Icon name="clock" size={12} /> Preview
                  </span>
                </div>
              </div>

              <Field label="Edit message" hint="Tweak the text before sending.">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  placeholder="Type your reminder…"
                />
              </Field>

              {!data.wa_link && (
                <div className={styles.warn}>
                  <Icon name="alert" size={16} />
                  <span>
                    {data.phone
                      ? 'This party has no valid WhatsApp number.'
                      : 'No valid phone number for this party.'}
                  </span>
                </div>
              )}

              <div className={styles.sendRow}>
                <Button variant="success" onClick={onSend} disabled={!canSend}>
                  <Icon name="whatsapp" size={16} /> Send on WhatsApp
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

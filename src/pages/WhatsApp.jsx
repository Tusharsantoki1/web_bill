import React, { useEffect, useMemo, useRef, useState } from 'react';

import { WhatsAppAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import {
  Button, Card, Field, Textarea, PageHeader, PartySelect, Spinner, EmptyState, ErrorText,
} from '../components/ui';
import Icon from '../components/Icon';
import { money } from '../utils/format';
import styles from './WhatsApp.module.css';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'gu', label: 'ગુજરાતી' },
];

export default function WhatsApp() {
  const [party, setParty] = useState(null);
  const [data, setData] = useState(null);
  const [lang, setLang] = useState('en');
  // Edits are tracked per language so switching back and forth does not throw
  // away what the user typed.
  const [edited, setEdited] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const latestRequest = useRef(0);
  const copyTimer = useRef(null);

  // Clear the "Copied!" timer on unmount so it cannot set state afterwards.
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const message = useMemo(() => {
    if (edited[lang] !== undefined) return edited[lang];
    return data?.messages?.[lang] ?? data?.message ?? '';
  }, [edited, lang, data]);

  async function onPickParty(p) {
    setParty(p);
    setData(null);
    setEdited({});
    setError(null);
    setBlocked(false);
    if (!p) return;

    // Only the newest request may write state — switching parties quickly
    // would otherwise let a slow earlier response overwrite a newer one.
    const requestId = ++latestRequest.current;
    setLoading(true);
    try {
      const res = await WhatsAppAPI.reminder(p.id, lang);
      if (requestId === latestRequest.current) setData(res);
    } catch (err) {
      if (requestId === latestRequest.current) setError(getErrorMessage(err));
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }

  function onEditMessage(value) {
    setEdited((prev) => ({ ...prev, [lang]: value }));
  }

  function onResetMessage() {
    setEdited((prev) => {
      const next = { ...prev };
      delete next[lang];
      return next;
    });
  }

  // Build the deep link from scratch rather than mutating the server's URL.
  // URLSearchParams would encode spaces as "+", which WhatsApp renders
  // literally, so the query is assembled with encodeURIComponent instead.
  const link = useMemo(() => {
    if (!data?.wa_number || !message.trim()) return null;
    return `https://wa.me/${data.wa_number}?text=${encodeURIComponent(message)}`;
  }, [data, message]);

  function onSend() {
    if (!link) return;
    setBlocked(false);
    // Note: passing "noopener" in the feature string makes window.open return
    // null even on success, which would look identical to a blocked popup.
    // Open normally and sever the opener afterwards instead.
    const win = window.open(link, '_blank');
    if (win) {
      win.opener = null;
    } else {
      // Blocked — surface the copy-link fallback rather than doing nothing.
      setBlocked(true);
    }
  }

  async function onCopyLink() {
    if (!link) return;
    try {
      // navigator.clipboard is undefined on insecure origins, so guard rather
      // than assume it exists.
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(link);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fall back to a prompt the user can copy from by hand.
      window.prompt('Copy this WhatsApp link:', link);
    }
  }

  const isEdited = edited[lang] !== undefined;
  const canSend = Boolean(link);

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
              <div className={styles.langRow}>
                <div className={styles.langTabs} role="group" aria-label="Message language">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      className={l.code === lang ? styles.langActive : styles.langBtn}
                      onClick={() => setLang(l.code)}
                      aria-pressed={l.code === lang}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                {isEdited && (
                  <button type="button" className={styles.reset} onClick={onResetMessage}>
                    Reset to template
                  </button>
                )}
              </div>

              <div className={styles.chat}>
                <div className={styles.bubble}>
                  <span className={styles.bubbleText} lang={lang}>
                    {message || 'Your message is empty…'}
                  </span>
                  <span className={styles.bubbleMeta}>
                    <Icon name="clock" size={12} /> Preview
                  </span>
                </div>
              </div>

              <Field label="Edit message" hint="Tweak the text before sending.">
                <Textarea
                  value={message}
                  onChange={(e) => onEditMessage(e.target.value)}
                  rows={8}
                  lang={lang}
                  placeholder="Type your reminder…"
                />
              </Field>

              {!data.wa_number && (
                <div className={styles.warn}>
                  <Icon name="alert" size={16} />
                  <span>
                    {data.phone
                      ? `"${data.phone}" is not a valid Indian mobile number, so WhatsApp cannot open a chat.`
                      : 'No phone number saved for this party.'}
                  </span>
                </div>
              )}

              {blocked && link && (
                <div className={styles.warn}>
                  <Icon name="alert" size={16} />
                  <span>
                    Your browser blocked the WhatsApp window. Use “Copy link” and paste it
                    into a new tab.
                  </span>
                </div>
              )}

              <div className={styles.sendRow}>
                <Button variant="success" onClick={onSend} disabled={!canSend}>
                  <Icon name="whatsapp" size={16} /> Send on WhatsApp
                </Button>
                <Button variant="secondary" onClick={onCopyLink} disabled={!canSend}>
                  <Icon name="copy" size={16} /> {copied ? 'Copied!' : 'Copy link'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

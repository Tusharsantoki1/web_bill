import React from 'react';

import { useAuth } from '../auth/AuthContext';
import Icon from './Icon';
import styles from './SubscriptionGate.module.css';

function formatDate(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Explains why billing is unavailable, and hides its children when it is.
 *
 * This is UX only — `require_billing_access` on the backend is the actual
 * enforcement, so a stale or spoofed client cannot create bills regardless.
 */
export default function SubscriptionGate({ children }) {
  const { subscription, isSubscribed, canEdit, canCreateBills } = useAuth();

  if (canCreateBills) return children ?? null;

  // A read-only viewer is blocked for a different reason than an expired plan;
  // saying "renew your subscription" to a viewer would just be confusing.
  if (!canEdit) {
    return (
      <div className={`${styles.banner} ${styles.info}`}>
        <Icon name="alert" size={18} />
        <div>
          <strong>Read-only access</strong>
          <p>Your account cannot create bills. Ask a company admin for editing access.</p>
        </div>
      </div>
    );
  }

  const current = subscription?.current;
  const expiredOn = formatDate(current?.end_date);

  return (
    <div className={`${styles.banner} ${styles.warn}`}>
      <Icon name="alert" size={18} />
      <div>
        <strong>{current ? 'Subscription expired' : 'No active subscription'}</strong>
        <p>
          {current && expiredOn
            ? `Your plan ended on ${expiredOn}. Billing is paused until it is renewed.`
            : 'Billing is disabled until a subscription is activated for this company.'}
          {' '}
          Please contact the administrator.
        </p>
      </div>
    </div>
  );
}

/** Small inline status pill for headers and the dashboard. */
export function SubscriptionBadge() {
  const { subscription, isSubscribed } = useAuth();
  if (!subscription) return null;

  const days = subscription.days_remaining;
  if (!isSubscribed) {
    return <span className={`${styles.pill} ${styles.pillDanger}`}>Subscription inactive</span>;
  }
  // Only nag when renewal is actually close.
  if (typeof days === 'number' && days <= 15) {
    return (
      <span className={`${styles.pill} ${styles.pillWarn}`}>
        {days <= 0 ? 'Expires today' : `Expires in ${days} day${days === 1 ? '' : 's'}`}
      </span>
    );
  }
  return null;
}

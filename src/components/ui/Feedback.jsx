import React from 'react';
import styles from './Feedback.module.css';

export function Spinner({ text }) {
  return (
    <div className={styles.center}>
      <span className={styles.spinner} />
      {text && <p className={styles.muted}>{text}</p>}
    </div>
  );
}

export function EmptyState({ title, subtitle, action }) {
  return (
    <div className={styles.center}>
      <p className={styles.emptyTitle}>{title}</p>
      {subtitle && <p className={styles.muted}>{subtitle}</p>}
      {action}
    </div>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <p className={styles.error}>{children}</p>;
}

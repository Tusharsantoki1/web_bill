import React from 'react';
import styles from './Field.module.css';

export function Field({ label, hint, error, children }) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      {children}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`${styles.input} ${className}`} {...props} />;
}

export function Textarea({ className = '', rows = 3, ...props }) {
  return <textarea className={`${styles.input} ${styles.textarea} ${className}`} rows={rows} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${styles.input} ${styles.select} ${className}`} {...props}>
      {children}
    </select>
  );
}

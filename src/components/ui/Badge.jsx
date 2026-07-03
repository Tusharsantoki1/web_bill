import React from 'react';
import styles from './Badge.module.css';

// tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'
export default function Badge({ children, tone = 'neutral' }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

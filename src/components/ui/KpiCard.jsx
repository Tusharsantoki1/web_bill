import React from 'react';
import styles from './KpiCard.module.css';

// tone: 'blue' | 'green' | 'amber' | 'red' | 'purple'
export default function KpiCard({ label, value, subtitle, icon, tone = 'blue' }) {
  return (
    <div className={`${styles.card} ${styles[tone]}`}>
      <div className={styles.info}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      {icon && <div className={`${styles.icon} ${styles[`icon_${tone}`]}`}>{icon}</div>}
    </div>
  );
}

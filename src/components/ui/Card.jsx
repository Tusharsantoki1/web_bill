import React from 'react';
import styles from './Card.module.css';

export default function Card({ title, action, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`${styles.card} ${className}`}>
      {(title || action) && (
        <header className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {action}
        </header>
      )}
      <div className={`${styles.body} ${bodyClassName}`}>{children}</div>
    </section>
  );
}

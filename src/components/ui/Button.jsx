import React from 'react';
import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) {
  const cls = [styles.btn, styles[variant], styles[size], className].filter(Boolean).join(' ');
  return (
    <button className={cls} type={type} disabled={disabled || loading} onClick={onClick} {...rest}>
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  );
}

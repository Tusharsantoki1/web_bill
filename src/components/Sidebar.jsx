import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../auth/AuthContext';
import styles from './Sidebar.module.css';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/customers', label: 'Customers', icon: 'customers' },
  { to: '/invoice-entry', label: 'Invoice Entry', icon: 'invoice' },
  { to: '/payment-entry', label: 'Payment Entry', icon: 'payment' },
  { to: '/outstanding', label: 'Outstanding Report', icon: 'rupee' },
  { to: '/aging', label: 'Aging Report', icon: 'clock' },
  { to: '/followups', label: 'Follow-up', icon: 'phone' },
  { to: '/whatsapp', label: 'WhatsApp Message', icon: 'whatsapp' },
  { to: '/reports', label: 'Reports', icon: 'reports' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
  { to: '/backup', label: 'Backup / Restore', icon: 'backup' },
  { to: '/users', label: 'User Management', icon: 'users' },
];

export default function Sidebar({ open, onClose }) {
  const { signOut } = useAuth();
  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
      <div className={styles.brand}>
        <div className={styles.logo}>UM</div>
        <div>
          <div className={styles.brandName}>Ughrani Management</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button className={styles.link} onClick={signOut}>
          <Icon name="logout" size={18} />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}

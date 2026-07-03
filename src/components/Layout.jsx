import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import styles from './Layout.module.css';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={styles.shell}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}
      <div className={styles.main}>
        <Topbar onMenu={() => setMenuOpen((o) => !o)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

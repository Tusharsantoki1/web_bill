import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { useAuth } from '../auth/AuthContext';
import { ReportAPI } from '../api/endpoints';
import { fmtDate, todayStr, ROLE_LABEL } from '../utils/format';
import styles from './Topbar.module.css';

export default function Topbar({ onMenu }) {
  const { user, company, signOut } = useAuth();
  const [notifs, setNotifs] = useState({ count: 0, items: [] });
  const [openNotif, setOpenNotif] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    ReportAPI.notifications().then(setNotifs).catch(() => {});
  }, []);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpenNotif(false);
        setOpenUser(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenu} aria-label="Menu">
          <span /><span /><span />
        </button>
        <div className={styles.company}>{company?.name || 'Dashboard'}</div>
      </div>

      <div className={styles.right} ref={ref}>
        <div className={styles.datePill}>
          <Icon name="calendar" size={16} />
          {fmtDate(todayStr())}
        </div>

        <div className={styles.notifWrap}>
          <button className={styles.iconBtn} onClick={() => { setOpenNotif((o) => !o); setOpenUser(false); }}>
            <Icon name="bell" size={20} />
            {notifs.count > 0 && <span className={styles.badge}>{notifs.count}</span>}
          </button>
          {openNotif && (
            <div className={styles.dropdown}>
              <div className={styles.dropHead}>Notifications</div>
              {notifs.items.length === 0 ? (
                <div className={styles.dropEmpty}>You're all caught up.</div>
              ) : (
                notifs.items.map((n, i) => (
                  <div key={i} className={styles.notifItem}>
                    <span className={`${styles.dot} ${styles[n.severity] || ''}`} />
                    <div>
                      <div className={styles.notifTitle}>{n.title}</div>
                      <div className={styles.notifMsg}>{n.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className={styles.notifWrap}>
          <button className={styles.user} onClick={() => { setOpenUser((o) => !o); setOpenNotif(false); }}>
            <div className={styles.avatar}>{(user?.full_name || 'A').charAt(0).toUpperCase()}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.full_name || 'Admin'}</div>
              <div className={styles.userRole}>{ROLE_LABEL[user?.role] || 'User'}</div>
            </div>
            <Icon name="chevronDown" size={16} />
          </button>
          {openUser && (
            <div className={styles.dropdown}>
              <div className={styles.dropHead}>{user?.email}</div>
              <button className={styles.logoutBtn} onClick={signOut}>
                <Icon name="logout" size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

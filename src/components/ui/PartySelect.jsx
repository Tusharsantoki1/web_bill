import React, { useEffect, useRef, useState } from 'react';
import { PartyAPI } from '../../api/endpoints';
import styles from './PartySelect.module.css';

/** Searchable party picker. value = party object | null; onChange(party). */
export default function PartySelect({ value, onChange, placeholder = 'Select a party' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    PartyAPI.list(query)
      .then((data) => active && setOptions(data))
      .catch(() => active && setOptions([]));
    return () => {
      active = false;
    };
  }, [open, query]);

  useEffect(() => {
    function onDoc(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className={styles.wrap} ref={boxRef}>
      <button type="button" className={styles.control} onClick={() => setOpen((o) => !o)}>
        <span className={value ? styles.value : styles.placeholder}>
          {value ? value.name : placeholder}
        </span>
        <span className={styles.caret}>▾</span>
      </button>
      {open && (
        <div className={styles.dropdown}>
          <input
            className={styles.search}
            autoFocus
            placeholder="Search parties…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className={styles.list}>
            {options.length === 0 ? (
              <div className={styles.empty}>No parties found</div>
            ) : (
              options.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className={styles.option}
                  onClick={() => {
                    onChange(p);
                    setOpen(false);
                  }}
                >
                  <span className={styles.optName}>{p.name}</span>
                  <span className={styles.optSub}>
                    {[p.city, p.phone].filter(Boolean).join(' · ')}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import styles from './DataTable.module.css';

/**
 * columns: [{ key, label, align?: 'left'|'right'|'center', render?: (row) => node, width? }]
 * rows: array of objects
 * rowKey: (row, index) => string
 * onRowClick?: (row) => void
 * footer?: node (a full <tr> or cells) — optional summary row
 */
export default function DataTable({ columns, rows, rowKey, onRowClick, empty, footer }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: c.align || 'left', width: c.width }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {empty || 'No records found.'}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? styles.clickable : ''}
              >
                {columns.map((c) => (
                  <td key={c.key} style={{ textAlign: c.align || 'left' }}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}

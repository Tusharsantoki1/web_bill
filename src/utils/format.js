// Indian-formatted rupee amount, e.g. 1245000 -> "₹12,45,000.00"
export function money(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return `₹${(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Short rupee (no paise), e.g. 1245000 -> "₹12,45,000"
export function moneyShort(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
}

export const todayStr = () => new Date().toISOString().slice(0, 10);

// "2026-07-02" -> "02-07-2026"
export function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}-${m}-${y}` : iso;
}

export const MODE_LABEL = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cheque: 'Cheque',
  card: 'Card',
  other: 'Other',
};

export const ROLE_LABEL = {
  company_admin: 'Administrator',
  company_staff: 'Staff',
  collection_executive: 'Collection Exec',
  viewer: 'Viewer',
};

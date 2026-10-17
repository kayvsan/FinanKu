export function formatIDR(num) {
  const n = Math.round(Number(num) || 0);
  return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseRupiahInput(str) {
  if (!str) return 0;
  return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
}

export function formatRupiahString(val) {
  const num = typeof val === 'number' ? val : parseRupiahInput(val);
  return num > 0 ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
}

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const pad2 = (n) => String(n).padStart(2, '0');

// YYYY-MM-DD in the device's own timezone. toISOString() is UTC, which in WIB (UTC+7)
// still returns yesterday's date until 07:00.
export function todayISO(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function currentMonth(date = new Date()) {
  return todayISO(date).slice(0, 7);
}

export function getMonthLabel(yyyyMm) {
  if (!yyyyMm || !yyyyMm.includes('-')) return '';
  const [y, m] = yyyyMm.split('-').map(Number);
  return `${MONTH_NAMES_ID[m - 1] || ''} ${y}`;
}

export function getPrevMonth(yyyyMm) {
  let [y, m] = yyyyMm.split('-').map(Number);
  m -= 1;
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function getNextMonth(yyyyMm) {
  let [y, m] = yyyyMm.split('-').map(Number);
  m += 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function formatDateIndo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = MONTH_NAMES_ID[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

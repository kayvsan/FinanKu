// Ported from website/src/shared/utils/formatters.js

export function formatIDR(num: number | string) {
  const n = Math.round(Number(num) || 0);
  const sign = n < 0 ? '-' : '';
  return sign + 'Rp ' + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseRupiahInput(str: string | number | null | undefined) {
  if (str === null || str === undefined || str === '') return 0;
  return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
}

export function formatRupiahString(val: string | number) {
  const num = typeof val === 'number' ? val : parseRupiahInput(val);
  return num > 0 ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
}

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function getMonthLabel(yyyyMm: string) {
  if (!yyyyMm || !yyyyMm.includes('-')) return '';
  const [y, m] = yyyyMm.split('-').map(Number);
  return `${MONTH_NAMES_ID[m - 1] || ''} ${y}`;
}

export function shiftMonth(yyyyMm: string, delta: number) {
  let [y, m] = yyyyMm.split('-').map(Number);
  m += delta;
  while (m > 12) { m -= 12; y += 1; }
  while (m < 1) { m += 12; y -= 1; }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export const getPrevMonth = (yyyyMm: string) => shiftMonth(yyyyMm, -1);

const pad2 = (n: number) => String(n).padStart(2, '0');

// YYYY-MM-DD in the device's own timezone. toISOString() is UTC, which in WIB (UTC+7)
// still returns yesterday's date until 07:00.
export function todayISO(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function currentMonth(date = new Date()) {
  return todayISO(date).slice(0, 7);
}

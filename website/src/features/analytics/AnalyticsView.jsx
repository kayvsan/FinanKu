import { useState } from 'react';
import { PieChart, TrendingUp } from 'lucide-react';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useFinance } from '../../context/FinanceContext';
import WindowBox from '../../shared/components/WindowBox';
import { formatIDR, getMonthLabel, getPrevMonth } from '../../shared/utils/formatters';
import { getMonthlySummary, getCategoryById } from '../../shared/utils/finance';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Neo-brutalist chart palette
const CHART_PALETTE = ['#1b1b3a', '#ff8fcf', '#ffe45e', '#8ed1fc', '#d6c7ff', '#bcead5', '#ffbe98', '#0f7a5a'];
const CHIP_CLASSES = ['chip-bubblegum', 'chip-butter', 'chip-sky', 'chip-lavender', 'chip-mint', 'chip-peach'];

const TOOLTIP_BASE = {
  backgroundColor: '#1b1b3a',
  titleFont: { family: 'Space Grotesk', weight: 'bold' },
  bodyFont: { family: 'Plus Jakarta Sans' },
  cornerRadius: 4
};

const DOUGHNUT_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: { boxWidth: 14, font: { size: 11, family: 'Plus Jakarta Sans' }, color: '#1b1b3a', padding: 10 }
    },
    tooltip: { ...TOOLTIP_BASE, callbacks: { label: ctx => ` ${ctx.label}: ${formatIDR(ctx.parsed)}` } }
  }
};

const BAR_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: { font: { family: 'Space Mono', size: 10 }, color: '#1b1b3a' },
      grid: { color: 'rgba(27,27,58,0.08)' }
    },
    x: {
      ticks: { font: { family: 'Space Mono', size: 10 }, color: '#1b1b3a' },
      grid: { display: false }
    }
  },
  plugins: {
    legend: { labels: { boxWidth: 14, font: { size: 11, family: 'Plus Jakarta Sans' }, color: '#1b1b3a' } },
    tooltip: { ...TOOLTIP_BASE, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatIDR(ctx.parsed.y)}` } }
  }
};

const labelStyle = { fontSize: '0.68rem', color: 'rgba(27,27,58,0.45)', fontFamily: 'var(--font-mono)' };
const valueStyle = { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem' };

export default function AnalyticsView() {
  const { state, selectedMonth, filterTransactionsByCategory } = useFinance();
  const [range, setRange] = useState('6');

  const cur = getMonthlySummary(state, selectedMonth);
  const entries = Object.entries(cur.byCategory).sort((a, b) => b[1] - a[1]);

  const doughnutData = {
    labels: entries.map(([cid]) => getCategoryById(state, cid).name),
    datasets: [{ data: entries.map(([, val]) => val), backgroundColor: CHART_PALETTE, borderWidth: 2, borderColor: '#1b1b3a' }]
  };

  const monthsList = [];
  let ptr = selectedMonth;
  for (let i = 0; i < parseInt(range, 10); i++) {
    monthsList.unshift(ptr);
    ptr = getPrevMonth(ptr);
  }
  const summaries = monthsList.map(m => getMonthlySummary(state, m));
  const barData = {
    labels: monthsList.map(m => getMonthLabel(m).slice(0, 3) + ' ' + m.slice(2, 4)),
    datasets: [
      { label: 'Pemasukan', data: summaries.map(s => s.income), backgroundColor: '#bcead5', borderColor: '#1b1b3a', borderWidth: 2, borderRadius: 3 },
      { label: 'Pengeluaran', data: summaries.map(s => s.expense), backgroundColor: '#ff8fcf', borderColor: '#1b1b3a', borderWidth: 2, borderRadius: 3 }
    ]
  };

  return (
    <div className="grid-2 gap-6">
      <WindowBox icon={PieChart} title="DISTRIBUSI_PENGELUARAN.DAT">
        <div className="chart-wrap h-64" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {entries.length > 0
            ? <Doughnut id="chart-category" data={doughnutData} options={DOUGHNUT_OPTIONS} />
            : <div id="chart-category-empty" className="empty-state">Belum ada pengeluaran pada bulan ini.</div>}
        </div>
        <div id="analytics-category-breakdown" className="mt-4 custom-scrollbar" style={{ maxHeight: 240, overflowY: 'auto' }}>
          {entries.map(([cid, val], i) => (
            <div key={cid} onClick={() => filterTransactionsByCategory(cid)} className="tx-item" style={{ cursor: 'pointer', borderRadius: 'var(--radius-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`chip ${CHIP_CLASSES[i % CHIP_CLASSES.length]}`} style={{ minWidth: 10, padding: '3px 6px' }}></span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{getCategoryById(state, cid).name}</span>
              </div>
              <div style={{ fontSize: '0.78rem' }}>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatIDR(val)}</span>{' '}
                <span style={{ color: 'rgba(27,27,58,0.4)', marginLeft: 4, fontFamily: 'var(--font-mono)' }}>({Math.round((val / cur.expense) * 100)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </WindowBox>

      <WindowBox
        color="sky"
        icon={TrendingUp}
        title="TREN_ARUS_KAS_BULANAN.GRAPH"
        actions={
          <select
            id="trend-range-select"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            style={{ width: 'auto', padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700, border: '1.5px solid var(--navy)', borderRadius: 4 }}
          >
            <option value="3">3 Bulan</option>
            <option value="6">6 Bulan</option>
            <option value="12">12 Bulan</option>
          </select>
        }
      >
        <div className="chart-wrap h-72">
          <Bar id="chart-trend" data={barData} options={BAR_OPTIONS} />
        </div>
        <div id="analytics-monthly-comparison" className="mt-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center', paddingTop: 12, borderTop: '1.5px solid rgba(27,27,58,0.1)' }}>
          <div><span style={labelStyle}>Pemasukan</span><div style={{ ...valueStyle, color: 'var(--success)' }}>{formatIDR(cur.income)}</div></div>
          <div><span style={labelStyle}>Pengeluaran</span><div style={{ ...valueStyle, color: 'var(--error)' }}>{formatIDR(cur.expense)}</div></div>
          <div><span style={labelStyle}>Selisih</span><div style={{ ...valueStyle, color: cur.net >= 0 ? 'var(--success)' : 'var(--error)' }}>{formatIDR(cur.net)}</div></div>
        </div>
      </WindowBox>
    </div>
  );
}

import {
  Cpu,
  MinusCircle,
  PlusCircle,
  Wallet,
  WalletCards,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  ShieldCheck,
  CreditCard,
  Bookmark,
  Clock,
  PieChart
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import WindowBox from '../../shared/components/WindowBox';
import TxItem from '../../shared/components/TxItem';
import { formatIDR, getMonthLabel, getPrevMonth } from '../../shared/utils/formatters';
import { calculateTotalBalance, calculateWalletBalance, getMonthlySummary, getBudgetStatuses } from '../../shared/utils/finance';

const STRIP_COLORS = { 'Bank': 'sky', 'E-Wallet': 'lavender', 'Tunai': 'mint' };

function calcDiff(now, old) {
  if (old === 0) return now > 0 ? '★ NAIK 100% DARI BLN LALU' : '★ BELUM ADA DATA LALU';
  const pct = Math.round(((now - old) / old) * 100);
  return `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct)}% DIBANDING BLN LALU`;
}

export default function DashboardView() {
  const { state, selectedMonth, switchPage, openTransactionModal } = useFinance();

  const totalBal = calculateTotalBalance(state);
  const cur = getMonthlySummary(state, selectedMonth);
  const prev = getMonthlySummary(state, getPrevMonth(selectedMonth));

  const budgets = getBudgetStatuses(state, selectedMonth);
  const alerts = budgets.filter(b => b.pct >= 80);

  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <>
      {/* HERO RETRO BANNER */}
      <div className="window-box mb-4">
        <div className="window-header">
          <div className="win-title">
            <Cpu style={{ width: 14, height: 14 }} />
            <span>SOROTAN_UTAMA.EXE</span>
          </div>
          <div className="win-controls">
            <span className="win-counter">1 / 4</span>
            <button className="win-btn" title="Minimize">_</button>
            <button className="win-btn" title="Maximize">□</button>
            <button className="win-btn close" title="Close">✕</button>
          </div>
        </div>
        <div className="window-body">
          <div className="hero-retro-grid">
            <div className="hero-left">
              <span className="retro-tag-pill">✦ FINTRACK OS</span>
              <h2 className="hero-retro-title">SALDO TOTAL KEUANGAN</h2>
              <p className="hero-retro-sub">Akumulasi seluruh aset likuid aktif dan status perputaran kas bulan {getMonthLabel(selectedMonth)}</p>
              <div className="hero-price-big" id="dash-total-balance">{formatIDR(totalBal)}</div>
              <div className="hero-btn-row">
                <button className="btn btn-hero-primary" onClick={() => openTransactionModal('expense')}>
                  <MinusCircle style={{ width: 15, height: 15 }} /> CATAT PENGELUARAN
                </button>
                <button className="btn btn-hero-secondary" onClick={() => openTransactionModal('income')}>
                  <PlusCircle style={{ width: 15, height: 15 }} /> CATAT PEMASUKAN
                </button>
                <button className="btn btn-hero-secondary" onClick={() => switchPage('wallets')}>
                  <Wallet style={{ width: 15, height: 15 }} /> KELOLA DOMPET
                </button>
              </div>
            </div>
            <div className="hero-right">
              <div className="hero-badge-box">
                <div className="badge-box-header">
                  <span>STATUS_SISTEM.LOG</span>
                  <span className="status-online-dot">● AKTIF</span>
                </div>
                <div className="badge-box-content">
                  <div className="wallet-icon-huge">
                    <WalletCards style={{ width: 38, height: 38 }} />
                  </div>
                  <div className="hero-stat-badge" id="dash-wallet-count">{state.wallets.length} Dompet Aktif</div>
                  <div id="dash-hero-status" style={{ fontSize: '0.75rem', color: 'rgba(27,27,58,0.6)', marginTop: 6, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>✦ DOMPET SINKRON</div>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-dots-row">
            <span className="hero-dot-bar active"></span>
            <span className="hero-dot"></span>
            <span className="hero-dot"></span>
            <span className="hero-dot"></span>
          </div>
        </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid-4 mb-4">
        <div className="retro-kpi-card">
          <div className="kpi-top-strip mint">
            <span className="strip-label">ARUS_MASUK.LOG</span>
            <span className="strip-badge">PEMASUKAN</span>
            <ArrowDownLeft style={{ width: 14, height: 14, color: 'var(--success)' }} />
          </div>
          <div className="kpi-card-content">
            <span className="kpi-mini-pill">⏱ BULAN INI</span>
            <div className="kpi-card-value income-color" id="dash-month-income">{formatIDR(cur.income)}</div>
            <div className="kpi-bottom-tag" id="dash-income-diff">{calcDiff(cur.income, prev.income)}</div>
          </div>
        </div>

        <div className="retro-kpi-card">
          <div className="kpi-top-strip pink">
            <span className="strip-label">ARUS_KELUAR.LOG</span>
            <span className="strip-badge">PENGELUARAN</span>
            <ArrowUpRight style={{ width: 14, height: 14, color: 'var(--error)' }} />
          </div>
          <div className="kpi-card-content">
            <span className="kpi-mini-pill">⚡ REAL-TIME</span>
            <div className="kpi-card-value expense-color" id="dash-month-expense">{formatIDR(cur.expense)}</div>
            <div className="kpi-bottom-tag" id="dash-expense-diff">{calcDiff(cur.expense, prev.expense)}</div>
          </div>
        </div>

        <div className="retro-kpi-card">
          <div className="kpi-top-strip sky">
            <span className="strip-label">NERACA_BERSIH.CALC</span>
            <span className="strip-badge">SELISIH</span>
            <Scale style={{ width: 14, height: 14 }} />
          </div>
          <div className="kpi-card-content">
            <span className="kpi-mini-pill">⚖️ STATUS KAS</span>
            <div className={`kpi-card-value ${cur.net >= 0 ? 'income-color' : 'expense-color'}`} id="dash-month-net">
              {(cur.net >= 0 ? '+' : '') + formatIDR(cur.net)}
            </div>
            <div className="kpi-bottom-tag" id="dash-net-status">{cur.net >= 0 ? '★ SURPLUS BULAN INI' : '★ DEFISIT BULAN INI'}</div>
          </div>
        </div>

        <div className="retro-kpi-card">
          <div className="kpi-top-strip peach">
            <span className="strip-label">KESEHATAN_KAS.SYS</span>
            <span className="strip-badge">DISIPLIN</span>
            <ShieldCheck style={{ width: 14, height: 14 }} />
          </div>
          <div className="kpi-card-content">
            <span className="kpi-mini-pill">🛡️ KENDALI</span>
            <div
              className="kpi-card-value"
              id="dash-kpi-budget-status"
              style={{ fontSize: '1.15rem', color: alerts.length > 0 ? 'var(--error)' : 'var(--navy)' }}
            >
              {alerts.length > 0 ? 'PERHATIAN' : 'TERKENDALI'}
            </div>
            <div className="kpi-bottom-tag" id="dash-kpi-budget-sub">
              {alerts.length > 0 ? `★ ${alerts.length} ANGGARAN OVER LIMIT` : '★ SEMUA ANGGARAN AMAN'}
            </div>
          </div>
        </div>
      </div>

      <div id="dash-budget-alerts" className={alerts.length > 0 ? '' : 'hidden'}>
        {alerts.map(({ cat, pct, spent, limit }) => (
          pct >= 100 ? (
            <div key={cat.id} className="alert-banner error">
              <span><strong>Anggaran Terlampaui:</strong> <b>{cat.name}</b> sudah {pct}% ({formatIDR(spent)} dari {formatIDR(limit)})</span>
              <button onClick={() => switchPage('budgets')}>Cek</button>
            </div>
          ) : (
            <div key={cat.id} className="alert-banner warn">
              <span><strong>Peringatan:</strong> <b>{cat.name}</b> sudah terpakai {pct}% ({formatIDR(spent)} dari {formatIDR(limit)})</span>
              <button onClick={() => switchPage('budgets')}>Cek</button>
            </div>
          )
        ))}
      </div>

      {/* WALLETS SECTION */}
      <WindowBox
        className="mb-4"
        icon={CreditCard}
        title="DOMPET_DAN_REKENING.DAT"
        actions={<button className="win-badge-btn" onClick={() => switchPage('wallets')}>LIHAT SEMUA →</button>}
      >
        <div id="dash-wallets-list" className="grid-4">
          {state.wallets.map((w, idx) => (
            <div key={w.id} className="retro-sub-card">
              <div className={`kpi-top-strip ${STRIP_COLORS[w.type] || 'sky'}`}>
                <span className="strip-label">{w.type.toUpperCase()}</span>
                <span className="strip-badge">AKTIF</span>
                <Bookmark style={{ width: 13, height: 13 }} />
              </div>
              <div className="sub-card-body">
                <span className="kpi-mini-pill">★ DOMPET {idx + 1}</span>
                <h4 className="sub-card-title">{w.name}</h4>
                <div className="sub-card-balance">{formatIDR(calculateWalletBalance(state, w.id))}</div>
              </div>
            </div>
          ))}
        </div>
      </WindowBox>

      {/* RECENT TX & BUDGETS SPLIT */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.15fr', gap: 20 }}>
        <WindowBox
          icon={Clock}
          title="TRANSAKSI_TERBARU.LOG"
          actions={<button className="win-badge-btn" onClick={() => switchPage('transactions')}>SEMUA TRANSAKSI →</button>}
        >
          <div id="dash-recent-tx">
            {recent.length
              ? recent.map(tx => <TxItem key={tx.id} tx={tx} />)
              : <div className="empty-state">Belum ada transaksi tercatat. Tekan tombol "Catat Transaksi" untuk mulai.</div>}
          </div>
        </WindowBox>

        <WindowBox
          color="sky"
          icon={PieChart}
          title="PANTAUAN_ANGGARAN.SYS"
          actions={<button className="win-badge-btn" onClick={() => switchPage('budgets')}>ATUR →</button>}
        >
            <div id="dash-budget-bars">
              {budgets.length ? budgets.map(({ cat, pct, spent, limit }) => {
                let fillClass = 'safe';
                let status = <span className="status-safe">Aman</span>;
                if (pct >= 100) {
                  fillClass = 'over';
                  status = <span className="status-over">Terlampaui</span>;
                } else if (pct >= 80) {
                  fillClass = 'warn';
                  status = <span className="status-warn">Hampir Habis</span>;
                }
                return (
                  <div key={cat.id} className="budget-bar-row">
                    <div className="budget-bar-label"><span style={{ fontWeight: 600 }}>{cat.name}</span><span>{status} ({pct}%)</span></div>
                    <div className="budget-bar-track"><div className={`budget-bar-fill ${fillClass}`} style={{ width: `${Math.min(pct, 100)}%` }}></div></div>
                    <div className="budget-bar-detail"><span>Terpakai: {formatIDR(spent)}</span><span>Batas: {formatIDR(limit)}</span></div>
                  </div>
                );
              }) : (
                <div className="empty-state">Belum ada anggaran yang diatur untuk {getMonthLabel(selectedMonth)}. Buka halaman Anggaran untuk mengatur batas.</div>
              )}
            </div>
        </WindowBox>
      </div>
    </>
  );
}

import {
  Wallet,
  PlusCircle,
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  PieChart,
  TrendingUp,
  Target,
  Tags,
  Settings
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Riwayat Transaksi', icon: ArrowLeftRight },
  { id: 'wallets', label: 'Dompet & Rekening', icon: CreditCard },
  { id: 'budgets', label: 'Anggaran Bulanan', icon: PieChart },
  { id: 'analytics', label: 'Analisis & Tren', icon: TrendingUp },
  { id: 'goals', label: 'Target Tabungan', icon: Target, phase: 'Fase 2' },
  { id: 'categories', label: 'Kategori', icon: Tags },
  { id: 'settings', label: 'Pengaturan', icon: Settings }
];

export default function Sidebar() {
  const { currentPage, switchPage, sidebarCollapsed, mobileSidebarOpen, toggleSidebar, openTransactionModal } = useFinance();

  const classes = ['sidebar'];
  if (sidebarCollapsed) classes.push('collapsed');
  if (mobileSidebarOpen) classes.push('mobile-open');

  return (
    <aside className={classes.join(' ')} id="sidebar">
      <div className="sidebar-window-bar">
        <span className="sidebar-text">NAVIGASI.EXE</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className="win-btn" onClick={toggleSidebar} title="Ciutkan / Lebarkan" style={{ cursor: 'pointer', border: 'none' }}>_</button>
          <button className="win-btn close" onClick={toggleSidebar} title="Toggle Sidebar" style={{ cursor: 'pointer', border: 'none' }}>✕</button>
        </div>
      </div>

      <div className="sidebar-logo-area" onClick={() => switchPage('dashboard')} style={{ cursor: 'pointer' }}>
        <div className="sidebar-logo-icon">
          <Wallet />
        </div>
        <div className="sidebar-brand sidebar-text">
          <h1>FinTrack<span style={{ color: 'var(--bubblegum)' }}>.id</span></h1>
          <div className="sidebar-brand-sub">PERSONAL FINANCE OS</div>
        </div>
      </div>

      <button className="sidebar-cta" onClick={() => openTransactionModal()}>
        <PlusCircle style={{ width: 17, height: 17 }} />
        <span className="sidebar-text">CATAT TRANSAKSI</span>
      </button>

      <nav className="custom-scrollbar" id="desktop-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon, phase }) => (
          <button
            key={id}
            onClick={() => switchPage(id)}
            data-nav={id}
            className={`nav-btn${currentPage === id ? ' active' : ''}`}
          >
            <Icon /> <span className="sidebar-text">{label}</span>
            {phase && <span className="badge-phase sidebar-text">{phase}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-text">OS v1.0 • ONLINE</span>
        <span className="online-dot" style={{ color: 'var(--success)', fontWeight: 700 }}>●</span>
      </div>
    </aside>
  );
}

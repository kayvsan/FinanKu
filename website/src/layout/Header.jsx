import { useEffect, useState } from 'react';
import { Menu, Search, ChevronDown, ChevronLeft, ChevronRight, TrendingUp, Target, Tags, Settings, Bell, User, LogOut } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { getMonthLabel } from '../shared/utils/formatters';

const PILLS = [
  { id: 'dashboard', label: 'DASHBOARD' },
  { id: 'transactions', label: 'TRANSAKSI' },
  { id: 'wallets', label: 'DOMPET' },
  { id: 'budgets', label: 'ANGGARAN' }
];

export default function Header({ searchInputRef }) {
  const { currentPage, switchPage, selectedMonth, changeGlobalMonth, toggleSidebar, handleGlobalSearch, budgetAlertCount } = useFinance();
  const { currentUser, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    logout();
  };

  useEffect(() => {
    if (!openMenu) return;
    const onDocClick = (e) => {
      if (!e.target.closest('.header-dropdown-wrap')) setOpenMenu(null);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [openMenu]);

  const toggleMenu = (name) => setOpenMenu(current => (current === name ? null : name));

  const go = (page) => {
    setOpenMenu(null);
    switchPage(page);
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button className="header-sidebar-toggle" onClick={toggleSidebar} title="Toggle Sidebar">
          <Menu />
        </button>
        <div className="header-search-wrap">
          <Search />
          <input
            ref={searchInputRef}
            type="text"
            id="header-global-search"
            placeholder="Cari transaksi, dompet, atau #tag..."
            onInput={(e) => handleGlobalSearch(e.target.value)}
          />
          <kbd className="header-kbd">/</kbd>
        </div>
      </div>

      <div className="header-right">
        <div className="header-nav-pills">
          {PILLS.map(p => (
            <button
              key={p.id}
              className={`header-pill${currentPage === p.id ? ' active' : ''}`}
              onClick={() => go(p.id)}
              data-header-nav={p.id}
            >
              {p.label}
            </button>
          ))}
          <div className="header-dropdown-wrap">
            <button className="header-pill header-dropdown-btn" onClick={() => toggleMenu('more')}>
              <span>LAINNYA</span> <ChevronDown style={{ width: 13, height: 13 }} />
            </button>
            <div className={`header-dropdown-menu${openMenu === 'more' ? ' show' : ''}`} id="header-menu-dropdown">
              <button className="dropdown-item" onClick={() => go('analytics')}><TrendingUp /> Analisis & Tren</button>
              <button className="dropdown-item" onClick={() => go('goals')}><Target /> Target Tabungan</button>
              <button className="dropdown-item" onClick={() => go('categories')}><Tags /> Kelola Kategori</button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={() => go('settings')}><Settings /> Pengaturan & Cadangan</button>
            </div>
          </div>
        </div>

        <div className="month-picker">
          <button onClick={() => changeGlobalMonth(-1)} title="Bulan Sebelumnya">
            <ChevronLeft style={{ width: 14, height: 14 }} />
          </button>
          <span id="global-month-label">{getMonthLabel(selectedMonth)}</span>
          <button onClick={() => changeGlobalMonth(1)} title="Bulan Berikutnya">
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div className="header-badge-curr" title="Mata Uang">ID / RP</div>

        <button className="header-icon-btn" onClick={() => go('budgets')} title="Peringatan Anggaran">
          <Bell style={{ width: 16, height: 16 }} />
          <span className="header-notif-badge" id="header-notif-count">{budgetAlertCount}</span>
        </button>

        {/* Account menu: visible at every width (the nav pills are hidden on mobile) */}
        <div className="header-dropdown-wrap">
          <button
            type="button"
            className="header-user-pill"
            onClick={() => toggleMenu('user')}
            title="Akun"
            aria-haspopup="menu"
            aria-expanded={openMenu === 'user'}
          >
            <User style={{ width: 14, height: 14 }} />
            <span className="header-user-name">{currentUser}</span>
            <span aria-hidden="true">▾</span>
          </button>
          <div className={`header-dropdown-menu${openMenu === 'user' ? ' show' : ''}`} role="menu">
            <div className="dropdown-user-label">
              <span>MASUK SEBAGAI</span>
              <strong>{currentUser}</strong>
            </div>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item" role="menuitem" onClick={() => go('settings')}><Settings /> Pengaturan & Cadangan</button>
            <button className="dropdown-item danger" role="menuitem" onClick={handleLogout} disabled={loggingOut}>
              <LogOut /> {loggingOut ? 'Keluar...' : 'Keluar'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

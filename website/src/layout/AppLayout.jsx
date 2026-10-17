import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router';
import { LayoutDashboard, ArrowLeftRight, Plus, PieChart, TrendingUp } from 'lucide-react';
import TopTickerBar from './TopTickerBar';
import Sidebar from './Sidebar';
import Header from './Header';
import { useFinance } from '../context/FinanceContext';
import TransactionModal from '../features/transactions/components/TransactionModal';
import WalletModal from '../features/wallets/components/WalletModal';
import CategoryModal from '../features/categories/components/CategoryModal';
import CategoryReplaceModal from '../features/categories/components/CategoryReplaceModal';
import GoalModal from '../features/goals/components/GoalModal';

export default function AppLayout() {
  const {
    state,
    currentPage,
    switchPage,
    mobileSidebarOpen,
    closeMobileSidebar,
    openTransactionModal,
    closeAllModals,
    txModal,
    walletModal,
    categoryModal,
    categoryReplace,
    goalModalOpen
  } = useFinance();
  const searchInputRef = useRef(null);

  // Keyboard shortcuts: 'N' for transaction, '/' for search, Escape closes modals
  useEffect(() => {
    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.key === '/') {
        e.preventDefault();
        const s = searchInputRef.current;
        if (s) { s.focus(); s.select(); }
      }
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openTransactionModal();
      }
      if (e.key === 'Escape') closeAllModals();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openTransactionModal, closeAllModals]);

  const walletOnboarding = state.wallets.length === 0;

  const mobBtn = (id, label, Icon) => (
    <button onClick={() => switchPage(id)} data-nav={id} className={`mob-btn nav-btn${currentPage === id ? ' active' : ''}`}>
      <Icon style={{ width: 20, height: 20 }} /><span>{label}</span>
    </button>
  );

  return (
    <>
      {/* TOP RUNNING MARQUEE TICKER */}
      <TopTickerBar />

      <div className="app-body-layout">
        {/* MOBILE BACKDROP */}
        <div className={`sidebar-backdrop${mobileSidebarOpen ? ' show' : ''}`} id="sidebar-backdrop" onClick={closeMobileSidebar}></div>

        <Sidebar />

        <div className="main-wrapper">
          <Header searchInputRef={searchInputRef} />

          <main className="content-area">
            <section key={currentPage} id={`view-${currentPage}`} className="page-view visible animate-fade">
              <Outlet />
            </section>
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-nav">
        {mobBtn('dashboard', 'Beranda', LayoutDashboard)}
        {mobBtn('transactions', 'Transaksi', ArrowLeftRight)}
        <button onClick={() => openTransactionModal()} className="mob-fab">
          <Plus style={{ width: 24, height: 24 }} />
        </button>
        {mobBtn('budgets', 'Anggaran', PieChart)}
        {mobBtn('analytics', 'Analisis', TrendingUp)}
      </nav>

      {/* RETRO FAB BUTTON */}
      <button className="retro-fab" onClick={() => openTransactionModal()} title="Catat Transaksi Cepat (Shortcut: N)">
        <span className="retro-fab-star">✦</span>
        <span>CATAT TRANSAKSI</span>
        <span className="retro-fab-key">N</span>
      </button>

      {/* MODALS */}
      {txModal.open && <TransactionModal />}
      {(walletModal.open || walletOnboarding) && <WalletModal onboarding={walletOnboarding} />}
      {categoryModal.open && <CategoryModal />}
      {categoryReplace.open && <CategoryReplaceModal />}
      {goalModalOpen && <GoalModal />}
    </>
  );
}

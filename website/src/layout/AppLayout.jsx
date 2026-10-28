import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router';
import { LayoutGrid, ArrowLeftRight, Plus, PieChart, TrendingUp } from 'lucide-react';
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

  // Keyboard shortcuts: 'N' for transaction, '/' or '⌘K' for search, Escape closes modals
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const s = searchInputRef.current;
        if (s) { s.focus(); s.select(); }
        return;
      }
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
    <button
      type="button"
      onClick={() => switchPage(id)}
      data-nav={id}
      className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
        currentPage === id
          ? 'bg-[#CCF32F] text-[#11221B] border-2 border-[#11221B]'
          : 'text-[#11221B]/70'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#11221B] flex flex-row relative">
      {/* MOBILE BACKDROP */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#11221B]/40 z-40 md:hidden"
          id="sidebar-backdrop"
          onClick={closeMobileSidebar}
        />
      )}

      {/* A. Sidebar Kiri Tetap */}
      <Sidebar searchInputRef={searchInputRef} />

      {/* B. Area Konten Utama */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen pb-24 md:pb-12">
        <Header />

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-5 md:px-10 py-4">
          <section key={currentPage} id={`view-${currentPage}`} className="page-view visible animate-fade">
            <Outlet />
          </section>
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#F8F7F2] border-t-2 border-[#11221B] px-2 py-1.5 flex md:hidden items-center justify-around">
        {mobBtn('dashboard', 'Beranda', LayoutGrid)}
        {mobBtn('transactions', 'Alur', ArrowLeftRight)}
        <button
          type="button"
          onClick={() => openTransactionModal()}
          className="w-12 h-12 -mt-6 rounded-2xl bg-[#CCF32F] text-[#11221B] border-2 border-[#11221B] shadow-[3px_3px_0px_0px_#11221B] flex items-center justify-center cursor-pointer"
          aria-label="Catat Transaksi"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
        {mobBtn('budgets', 'Anggaran', PieChart)}
        {mobBtn('analytics', 'Laporan', TrendingUp)}
      </nav>

      {/* MODALS */}
      {txModal.open && <TransactionModal />}
      {(walletModal.open || walletOnboarding) && <WalletModal onboarding={walletOnboarding} />}
      {categoryModal.open && <CategoryModal />}
      {categoryReplace.open && <CategoryReplaceModal />}
      {goalModalOpen && <GoalModal />}
    </div>
  );
}


import { Menu, ChevronLeft, ChevronRight, Bell, Compass, LayoutGrid, GitBranch } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { getMonthLabel } from '../shared/utils/formatters';
import { getBudgetStatuses, calculateTotalBalance } from '../shared/utils/finance';
import { formatIDR } from '../shared/utils/formatters';

export default function Header() {
  const {
    currentPage,
    switchPage,
    selectedMonth,
    changeGlobalMonth,
    toggleSidebar,
    budgetAlertCount,
    state,
    openTransactionModal
  } = useFinance();
  const { currentUser } = useAuth();

  const displayName = currentUser ? currentUser.charAt(0).toUpperCase() + currentUser.slice(1) : 'Galih';

  const budgets = getBudgetStatuses(state, selectedMonth);
  const safeCount = budgets.filter((b) => b.pct < 80).length;
  const totalBal = calculateTotalBalance(state);

  const isAlurActive = currentPage === 'transactions' || currentPage === 'analytics';

  return (
    <header className="w-full px-5 md:px-10 pt-6 pb-2 flex flex-col gap-4">
      {/* Top Row: Greeting Left + Segmented Toggle & Month Controls Right */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Left: Greeting & Sub-text */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="md:hidden w-10 h-10 rounded-xl border-2 border-[#11221B] bg-white shadow-[2px_2px_0px_0px_#11221B] flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5 text-[#11221B]" />
            </button>

            <h1 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-[#11221B] leading-tight">
              Halo,{' '}
              <span className="relative inline-block px-2.5 py-0.5 bg-[#CCF32F] rounded-xl border-2 border-[#11221B] shadow-[3px_3px_0px_0px_#11221B] -rotate-1">
                {displayName}
              </span>
              .
            </h1>
          </div>

          <p className="text-sm md:text-base font-medium text-[#11221B]/80 mt-1">
            {budgets.length > 0
              ? `${safeCount} dari ${budgets.length} pos anggaran bulan ${getMonthLabel(selectedMonth)} terkendali · Saldo aktif ${formatIDR(totalBal)}.`
              : `Saldo aktif ${formatIDR(totalBal)} pada periode ${getMonthLabel(selectedMonth)}. Tinggal atur pos anggaran bulananmu.`}
          </p>

          <div className="flex items-center gap-2 text-xs text-[#11221B]/75 mt-0.5">
            <Compass className="w-4 h-4 text-[#11221B] shrink-0" />
            <span>Ingin mulai mencatat hari ini?</span>
            <button
              type="button"
              onClick={() => openTransactionModal('expense')}
              className="font-bold text-[#11221B] underline underline-offset-4 hover:text-[#0F7A5A] cursor-pointer"
            >
              Catat transaksi 30 detik
            </button>
          </div>
        </div>

        {/* Right: Month selector, Alert bell, and Segmented toggle switch ('Katalog' / 'Alur') */}
        <div className="flex flex-wrap items-center gap-3 self-start">
          {/* Month Picker Pill */}
          <div className="inline-flex items-center gap-1 bg-white border-2 border-[#11221B] rounded-full px-2 py-1 shadow-[3px_3px_0px_0px_#11221B]">
            <button
              type="button"
              onClick={() => changeGlobalMonth(-1)}
              className="w-7 h-7 rounded-full hover:bg-[#F8F7F2] flex items-center justify-center text-[#11221B] cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span id="global-month-label" className="font-mono text-xs font-bold px-2 text-[#11221B] whitespace-nowrap">
              {getMonthLabel(selectedMonth)}
            </span>
            <button
              type="button"
              onClick={() => changeGlobalMonth(1)}
              className="w-7 h-7 rounded-full hover:bg-[#F8F7F2] flex items-center justify-center text-[#11221B] cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => switchPage('budgets')}
            title="Peringatan Anggaran"
            className="relative w-10 h-10 rounded-full bg-white border-2 border-[#11221B] shadow-[3px_3px_0px_0px_#11221B] hover:-translate-y-0.5 transition-transform flex items-center justify-center cursor-pointer"
          >
            <Bell className="w-4 h-4 text-[#11221B]" />
            {budgetAlertCount > 0 && (
              <span
                id="header-notif-count"
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#CCF32F] border-2 border-[#11221B] font-mono text-[10px] font-bold flex items-center justify-center text-[#11221B]"
              >
                {budgetAlertCount}
              </span>
            )}
          </button>

          {/* Segmented Toggle Switch: Katalog vs Alur */}
          <div
            role="group"
            aria-label="Mode Tampilan"
            className="inline-flex items-center p-1 rounded-full border-2 border-[#11221B] bg-white shadow-[3px_3px_0px_0px_#11221B]"
          >
            <button
              type="button"
              onClick={() => switchPage('dashboard')}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                !isAlurActive
                  ? 'bg-[#11221B] text-white'
                  : 'text-[#11221B] hover:bg-[#11221B]/5'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Katalog</span>
            </button>
            <button
              type="button"
              onClick={() => switchPage('transactions')}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isAlurActive
                  ? 'bg-[#11221B] text-white'
                  : 'text-[#11221B] hover:bg-[#11221B]/5'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Alur</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


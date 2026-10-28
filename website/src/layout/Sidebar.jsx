import { useState } from 'react';
import {
  Search,
  LayoutGrid,
  ArrowLeftRight,
  Wallet,
  PieChart,
  TrendingUp,
  Target,
  Tags,
  Settings,
  Plus,
  ChevronUp,
  LogOut,
  X
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';

const MENU_GROUPS = [
  {
    group: 'Belajar & Pantau',
    items: [
      { id: 'dashboard', label: 'Beranda', icon: LayoutGrid, bg: 'bg-[#CCF32F]' },
      { id: 'transactions', label: 'Alur Transaksi', icon: ArrowLeftRight, bg: 'bg-[#BAE6FD]' },
      { id: 'goals', label: 'Pencapaian', icon: Target, bg: 'bg-[#FED7AA]' },
      { id: 'budgets', label: 'Anggaran', icon: PieChart, bg: 'bg-[#FEF08A]' },
    ]
  },
  {
    group: 'Pustaka Kas',
    items: [
      { id: 'wallets', label: 'Dompet & Akun', icon: Wallet, bg: 'bg-[#BBF7D0]' },
      { id: 'categories', label: 'Kategori Kas', icon: Tags, bg: 'bg-[#FBCFE8]' },
      { id: 'analytics', label: 'Laporan & Tren', icon: TrendingUp, bg: 'bg-[#BAE6FD]' },
    ]
  },
  {
    group: 'Praktik & Sistem',
    items: [
      { id: 'quick-tx', label: 'Catat Transaksi', icon: Plus, bg: 'bg-[#CCF32F]', action: 'tx' },
      { id: 'settings', label: 'Pengaturan Data', icon: Settings, bg: 'bg-[#D8B4FE]' },
    ]
  }
];

export default function Sidebar({ searchInputRef }) {
  const { currentPage, switchPage, mobileSidebarOpen, closeMobileSidebar, handleGlobalSearch, openTransactionModal, state } = useFinance();
  const { currentUser, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = currentUser ? currentUser.charAt(0).toUpperCase() + currentUser.slice(1) : 'Galih Pratama';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside
      id="sidebar"
      aria-label="Navigasi Utama"
      className={`w-64 shrink-0 bg-[#F8F7F2] border-r border-[#11221B]/15 flex flex-col justify-between select-none z-50 transition-transform duration-200 fixed md:sticky top-0 left-0 h-screen ${
        mobileSidebarOpen ? 'translate-x-0 shadow-[6px_0px_0px_0px_#11221B]' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* TOP HEADER & SEARCH */}
      <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
        <div className="flex items-center justify-between px-1 pt-1">
          <button
            type="button"
            onClick={() => switchPage('dashboard')}
            className="flex items-center gap-2 text-left group focus-visible:outline-2 focus-visible:outline-[#11221B] rounded-lg"
          >
            <div className="w-8 h-8 rounded-lg border-2 border-[#11221B] bg-[#CCF32F] shadow-[2px_2px_0px_0px_#11221B] flex items-center justify-center font-extrabold text-lg tracking-tighter text-[#11221B]">
              F
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-[#11221B]">
              FinanKu
            </span>
          </button>

          {mobileSidebarOpen && (
            <button
              type="button"
              onClick={closeMobileSidebar}
              className="md:hidden w-8 h-8 rounded-lg border-2 border-[#11221B] bg-white flex items-center justify-center"
              aria-label="Tutup navigasi"
            >
              <X className="w-4 h-4 text-[#11221B]" />
            </button>
          )}
        </div>

        {/* Search Bar rounded-full with shortcut badge ⌘K */}
        <div className="relative flex items-center">
          <div className="w-7 h-7 rounded-full border-2 border-[#11221B] bg-white flex items-center justify-center absolute left-2 pointer-events-none">
            <Search className="w-3.5 h-3.5 text-[#11221B]" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            id="header-global-search"
            placeholder="Cari..."
            onInput={(e) => handleGlobalSearch(e.target.value)}
            className="!w-full !pl-11 !pr-12 !py-2 !rounded-full !border-2 !border-[#11221B]/25 focus:!border-[#11221B] !bg-white/80 focus:!bg-white !text-xs !font-medium !text-[#11221B] placeholder:!text-[#11221B]/50 focus:!shadow-[2px_2px_0px_0px_#11221B] transition-all"
          />
          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#11221B]/70 bg-[#F8F7F2] border border-[#11221B]/25 rounded-md pointer-events-none">
            ⌘K
          </kbd>
        </div>

        {/* Navigation Groups */}
        <nav className="flex flex-col gap-5 mt-1" id="desktop-nav">
          {MENU_GROUPS.map((section) => (
            <div key={section.group} className="flex flex-col gap-1.5">
              <div className="px-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[#11221B]/55">
                {section.group}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = !item.action && currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-nav={item.action ? undefined : item.id}
                    onClick={() => {
                      if (item.action === 'tx') {
                        openTransactionModal('expense');
                      } else {
                        switchPage(item.id);
                      }
                    }}
                    className={`group w-full flex items-center gap-3 px-2.5 py-2 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#11221B] text-white shadow-[3px_3px_0px_0px_#CCF32F]'
                        : 'text-[#11221B] hover:bg-[#11221B]/5'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg border-2 border-[#11221B] ${item.bg} text-[#11221B] flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_#11221B] group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-4 h-4 stroke-[2.25]" />
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate">{item.label}</span>
                      {item.id === 'wallets' && (
                        <span className={`font-mono text-[10px] font-normal truncate ${isActive ? 'text-white/75' : 'text-[#11221B]/60'}`}>
                          {state.wallets.length} dompet aktif
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* FOOTER SIDEBAR: User Profile with Avatar, Name, and Lime Green Admin Badge */}
      <div className="p-3 border-t border-[#11221B]/15 bg-[#F8F7F2] relative">
        {profileOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border-2 border-[#11221B] rounded-2xl shadow-[4px_4px_0px_0px_#11221B] p-2 z-50">
            <div className="px-2.5 py-1.5 border-b border-[#11221B]/10">
              <div className="font-mono text-[10px] text-[#11221B]/55 uppercase">Masuk sebagai</div>
              <div className="font-bold text-xs text-[#11221B] truncate">{displayName}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                switchPage('settings');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-[#11221B] hover:bg-[#F8F7F2] rounded-xl text-left mt-1 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" /> Pengaturan & Cadangan
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-[#BA1A1A] hover:bg-red-50 rounded-xl text-left cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar Akun
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2.5 p-2 rounded-2xl hover:bg-white/80 border border-transparent hover:border-[#11221B]/20 transition-all cursor-pointer text-left"
          aria-expanded={profileOpen}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#CCF32F] border-2 border-[#11221B] flex items-center justify-center font-extrabold text-sm text-[#11221B]">
                {initial}
              </div>
              <div className="w-5 h-5 rounded-full bg-[#11221B] text-white border border-white flex items-center justify-center text-[10px] font-mono font-bold absolute -bottom-0.5 -left-0.5">
                N
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-extrabold text-[#11221B] truncate">
                {displayName}
              </span>
              <span className="inline-flex items-center gap-1 w-fit mt-0.5 px-2 py-0.5 bg-[#CCF32F] border border-[#11221B] rounded-full font-mono text-[10px] font-bold text-[#11221B] leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[#11221B]"></span>
                Admin
              </span>
            </div>
          </div>
          <ChevronUp className={`w-4 h-4 text-[#11221B]/60 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  );
}


import { useMemo } from 'react';
import {
  Check,
  Flame,
  Share2,
  ArrowRight,
  Pin,
  Wallet,
  Building2,
  Smartphone,
  Banknote,
  ShieldCheck,
  PiggyBank,
  Clock,
  PieChart,
  Plus
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import WindowBox from '../../shared/components/WindowBox';
import TxItem from '../../shared/components/TxItem';
import { formatIDR, getMonthLabel, todayISO } from '../../shared/utils/formatters';
import {
  calculateTotalBalance,
  calculateWalletBalance,
  getMonthlySummary,
  getBudgetStatuses
} from '../../shared/utils/finance';

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function CircularProgress({ pct, label, size = 64, stroke = 6, color = '#0F7A5A', trackColor = '#E5E7EB' }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={stroke}
          strokeDasharray="4 2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute font-mono text-xs font-extrabold text-[#11221B]">
        {label}
      </span>
    </div>
  );
}

export default function DashboardView() {
  const { state, selectedMonth, switchPage, openTransactionModal } = useFinance();

  const totalBal = calculateTotalBalance(state);
  const cur = getMonthlySummary(state, selectedMonth);
  const budgets = getBudgetStatuses(state, selectedMonth);
  const alerts = budgets.filter((b) => b.pct >= 80);

  const recent = useMemo(
    () => [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [state.transactions]
  );

  // 4 Financial Mission Checklist items derived from real state
  const hasWallets = state.wallets.length > 0;
  const monthTxCount = useMemo(
    () => state.transactions.filter((t) => t.date && t.date.startsWith(selectedMonth)).length,
    [state.transactions, selectedMonth]
  );
  const hasMonthTx = monthTxCount > 0;
  const hasBudgets = budgets.length > 0 && budgets.every((b) => b.pct < 100);
  const hasGoals = state.goals.length > 0;

  const checklistItems = [
    {
      id: 1,
      title: 'Siapkan Dompet & Saldo Awal',
      status: hasWallets ? 'Selesai' : 'Mulai',
      done: hasWallets,
      action: () => switchPage('wallets')
    },
    {
      id: 2,
      title: 'Catat Arus Kas Bulan Ini',
      status: hasMonthTx ? 'Selesai' : 'Berikutnya',
      done: hasMonthTx,
      action: () => openTransactionModal('expense')
    },
    {
      id: 3,
      title: 'Disiplin Pos Anggaran Bulanan',
      status: hasBudgets ? 'Selesai' : 'Berikutnya',
      done: hasBudgets,
      action: () => switchPage('budgets')
    },
    {
      id: 4,
      title: 'Alokasi Target Tabungan Impian',
      status: hasGoals ? 'Selesai' : '±3 Mnt',
      done: hasGoals,
      action: () => switchPage('goals')
    }
  ];

  const completedSteps = checklistItems.filter((item) => item.done).length;
  // Find first incomplete item as active highlight; if all done, highlight item 3 (or last)
  const activeIdx = checklistItems.findIndex((item) => !item.done);
  const highlightedIndex = activeIdx === -1 ? 2 : activeIdx;

  // Streak & active transaction days calculation from real transaction dates
  const txDatesSet = useMemo(
    () => new Set(state.transactions.map((t) => t.date).filter(Boolean)),
    [state.transactions]
  );

  const activeDaysInMonth = useMemo(() => {
    const dates = new Set(
      state.transactions
        .filter((t) => t.date && t.date.startsWith(selectedMonth))
        .map((t) => t.date)
    );
    return dates.size;
  }, [state.transactions, selectedMonth]);

  // Current week (Sunday to Saturday) activity
  const weekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun .. 6 = Sat
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek);

    return DAY_LABELS.map((label, idx) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + idx);
      const iso = todayISO(d);
      const isToday = idx === dayOfWeek;
      const hasTx = txDatesSet.has(iso);
      return { label, iso, isToday, active: hasTx || idx < dayOfWeek };
    });
  }, [txDatesSet]);

  const streakCount = Math.max(activeDaysInMonth, state.transactions.length > 0 ? Math.min(state.transactions.length, 30) : 0);
  const dotsFilled = Math.min(18, Math.max(1, Math.round((streakCount / 30) * 18)));

  // Bottom progress metrics
  const totalBudgetLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalBudgetSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const budgetHealthPct = totalBudgetLimit > 0
    ? Math.max(0, Math.min(100, Math.round(((totalBudgetLimit - totalBudgetSpent) / totalBudgetLimit) * 100)))
    : (hasWallets ? 100 : 0);

  const totalGoalTarget = state.goals.reduce((s, g) => s + (Number(g.target) || 0), 0);
  const totalGoalSaved = state.goals.reduce((s, g) => s + (Number(g.saved) || 0), 0);
  const goalProgressPct = totalGoalTarget > 0
    ? Math.min(100, Math.round((totalGoalSaved / totalGoalTarget) * 100))
    : 0;

  const overallChampionPct = Math.round(((completedSteps / 4) * 50) + (budgetHealthPct * 0.25) + (goalProgressPct * 0.25));

  const handleShareProgress = () => {
    const summaryText = `Progres Keuangan FinanKu (${getMonthLabel(selectedMonth)}): Saldo Aktif ${formatIDR(totalBal)}, ${completedSteps}/4 Misi Selesai, ${streakCount} Catatan Aktif!`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summaryText);
      window.alert('Ringkasan progres berhasil disalin ke clipboard!');
    } else {
      window.alert(summaryText);
    }
  };

  const monthShortCode = selectedMonth.slice(5, 7);

  return (
    <div className="flex flex-col gap-6">
      {/* TOP BENTO GRID (Asymmetric 2:1 Ratio -> 8 cols left, 4 cols right on lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (2/3 width = 8 cols): HERO MODULE CARD + BOTTOM PROGRESS CARD */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* HERO MODULE CARD (Split 1/3 Left Purple Dot Pattern + 2/3 Right White Checklist) */}
          <div className="bg-white border-2 border-[#11221B] rounded-2xl shadow-[4px_4px_0px_0px_#11221B] overflow-hidden grid grid-cols-1 md:grid-cols-12">
            {/* Sisi Kiri (1/3 lebar = 4 cols): Purple Pastel with Dot Pattern */}
            <div className="md:col-span-4 dot-pattern-purple border-b-2 md:border-b-0 md:border-r-2 border-[#11221B] p-6 flex flex-col justify-between items-center relative min-h-[280px] md:min-h-[420px]">
              {/* Top-left Tilted Badge */}
              <div className="self-start">
                <span className="inline-block px-3.5 py-1 bg-white border-2 border-[#11221B] rounded-xl font-mono text-xs font-extrabold text-[#11221B] shadow-[2px_2px_0px_0px_#11221B] -rotate-3">
                  Periode {monthShortCode}
                </span>
              </div>

              {/* Center Circular Progress Bar */}
              <div className="my-auto py-4 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-white border-2 border-[#11221B] shadow-[4px_4px_0px_0px_#11221B] flex items-center justify-center relative">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#E5E7EB"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#11221B"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - completedSteps / 4)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-mono text-2xl font-extrabold text-[#11221B] leading-none">
                      {completedSteps}/4
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#11221B]/70 mt-1">
                      target
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative Pushpin / Wallet Accent at Bottom */}
              <div className="self-end opacity-35 pointer-events-none">
                <Pin className="w-16 h-16 text-[#11221B] rotate-12 stroke-[1.75]" />
              </div>
            </div>

            {/* Sisi Kanan (2/3 lebar = 8 cols): White Background with Checklist & CTA */}
            <div className="md:col-span-8 bg-white p-6 md:p-8 flex flex-col justify-between gap-5">
              <div>
                <div className="font-mono text-xs font-bold text-[#0F7A5A] tracking-tight">
                  Status Kas Aktif · {getMonthLabel(selectedMonth)} · {state.wallets.length} dompet
                </div>

                {/* Big Hero Title (keeps #dash-total-balance ID for app compatibility) */}
                <h2
                  id="dash-total-balance"
                  className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#11221B] tracking-tight mt-1"
                >
                  {formatIDR(totalBal)}
                </h2>

                <p className="text-xs sm:text-sm font-medium text-[#11221B]/70 mt-1">
                  Pemasukan <span className="font-mono font-bold text-[#0F7A5A]" id="dash-month-income">+{formatIDR(cur.income)}</span>
                  {' · '}
                  Pengeluaran <span className="font-mono font-bold text-[#BA1A1A]" id="dash-month-expense">-{formatIDR(cur.expense)}</span>
                  {' · '}
                  <span className="font-mono font-bold text-[#11221B]">{completedSteps}/4 langkah</span>
                </p>

                {/* Checklist 4 Materi / Misi Keuangan */}
                <div className="mt-5 flex flex-col gap-2.5">
                  {checklistItems.map((item, idx) => {
                    const isHighlighted = idx === highlightedIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.action}
                        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isHighlighted
                            ? 'bg-[#F4F9D9] border-2 border-[#11221B] shadow-[2px_2px_0px_0px_#11221B]'
                            : 'bg-transparent border border-transparent hover:bg-[#F8F7F2] hover:border-[#11221B]/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.done ? (
                            <span className="w-7 h-7 rounded-lg bg-[#11221B] text-white border-2 border-[#11221B] flex items-center justify-center shrink-0">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </span>
                          ) : (
                            <span
                              className={`w-7 h-7 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center shrink-0 ${
                                isHighlighted
                                  ? 'bg-[#CCF32F] text-[#11221B] border-2 border-[#11221B]'
                                  : 'bg-white text-[#11221B]/70 border border-[#11221B]/30'
                              }`}
                            >
                              {item.id}
                            </span>
                          )}
                          <span className="text-xs sm:text-sm font-bold text-[#11221B] truncate">
                            {item.title}
                          </span>
                        </div>
                        <span
                          className={`font-mono text-xs font-bold shrink-0 ${
                            isHighlighted ? 'text-[#11221B]' : 'text-[#11221B]/60'
                          }`}
                        >
                          {item.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pill CTA Button & Quick Secondary Actions */}
              <div className="pt-2 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openTransactionModal('expense')}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-[#CCF32F] border-2 border-[#11221B] shadow-[3px_3px_0px_0px_#11221B] hover:-translate-y-0.5 active:translate-y-0 transition-transform font-extrabold text-sm text-[#11221B] cursor-pointer"
                  >
                    <span>Catat Transaksi · Kelola Kas</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openTransactionModal('income')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border-2 border-[#11221B] shadow-[2px_2px_0px_0px_#11221B] hover:bg-[#BBF7D0] text-xs font-bold text-[#11221B] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Pemasukan
                  </button>
                </div>

                <p className="text-xs text-[#11221B]/65">
                  Data transaksi dan saldo dompet tersimpan otomatis lintas perangkat.
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER KONTEN (Bottom Progress Card - Full Width inside Left Col) */}
          <div className="bg-white border-2 border-[#11221B] rounded-2xl shadow-[4px_4px_0px_0px_#11221B] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-5 border-b border-[#11221B]/15">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="font-mono text-2xl font-extrabold text-[#11221B]">
                  {overallChampionPct}%
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#0F7A5A]">
                  menuju Financial Champion · tuntaskan 4 misi kas
                </span>
              </div>
              <button
                type="button"
                onClick={() => switchPage('analytics')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#11221B] hover:underline cursor-pointer"
              >
                <span>Lihat di Laporan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5">
              {/* 01 Disiplin Anggaran */}
              <div
                onClick={() => switchPage('budgets')}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-[#F8F7F2] transition-colors cursor-pointer"
              >
                <CircularProgress
                  pct={budgetHealthPct}
                  label="01"
                  color="#0F7A5A"
                />
                <div className="flex flex-col">
                  <h3 className="text-sm font-extrabold text-[#11221B]">
                    Fundamental Anggaran
                  </h3>
                  <p className="font-mono text-xs text-[#11221B]/70 mt-0.5">
                    {budgetHealthPct}% · {budgets.filter((b) => b.pct < 80).length}/{Math.max(budgets.length, 1)} Pos Aman
                  </p>
                </div>
              </div>

              {/* 02 Target Tabungan & Dana */}
              <div
                onClick={() => switchPage('goals')}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-[#F8F7F2] transition-colors cursor-pointer"
              >
                <CircularProgress
                  pct={goalProgressPct}
                  label="02"
                  color="#EA580C"
                />
                <div className="flex flex-col">
                  <h3 className="text-sm font-extrabold text-[#11221B]">
                    Target Tabungan &amp; Aset
                  </h3>
                  <p className="font-mono text-xs text-[#11221B]/70 mt-0.5">
                    {goalProgressPct}% · {state.goals.length} Target Aktif
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3 width = 4 cols): 2 STACKED CARDS VERTICALLY */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* KARTU ATAS: STREAK CARD with Floating 'Rekor Baru!' Badge */}
          <div className="relative bg-[#FFFBF2] border-2 border-[#11221B] rounded-2xl shadow-[4px_4px_0px_0px_#11221B] p-6">
            {/* Floating Badge overlapping top-right border */}
            <div className="absolute -top-3.5 right-5 px-3 py-0.5 bg-[#CCF32F] border-2 border-[#11221B] rounded-full font-mono text-xs font-extrabold text-[#11221B] shadow-[2px_2px_0px_0px_#11221B]">
              Rekor Baru!
            </div>

            {/* Top Row: Orange Fire Box + Big Monospace Number */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FDBA74] border-2 border-[#11221B] shadow-[3px_3px_0px_0px_#11221B] -rotate-3 flex items-center justify-center shrink-0">
                <Flame className="w-8 h-8 text-[#9A3412] fill-[#EA580C]" />
              </div>
              <div>
                <div className="font-mono text-xs font-bold text-[#9A3412]">
                  Streak Catat Kas
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-extrabold text-[#11221B] leading-none">
                    {streakCount}
                  </span>
                  <span className="text-xs font-bold text-[#11221B]/80">
                    catatan aktif
                  </span>
                </div>
              </div>
            </div>

            {/* 7 Day Circles (Min-Sab) */}
            <div className="grid grid-cols-7 gap-1.5 mt-5 text-center">
              {weekDays.map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-1">
                  {d.isToday ? (
                    <div className="w-9 h-9 rounded-full border-2 border-dashed border-[#11221B] bg-white ring-2 ring-[#CCF32F] flex items-center justify-center">
                      {d.active && <Flame className="w-4 h-4 text-[#EA580C] fill-[#FDBA74]" />}
                    </div>
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-full border-2 border-[#11221B] flex items-center justify-center ${
                        d.active ? 'bg-[#FDBA74]' : 'bg-white'
                      }`}
                    >
                      <Flame className={`w-4 h-4 ${d.active ? 'text-[#9A3412] fill-[#EA580C]' : 'text-[#11221B]/25'}`} />
                    </div>
                  )}
                  <span
                    className={`font-mono text-[10px] ${
                      d.isToday ? 'font-extrabold text-[#11221B]' : 'font-bold text-[#11221B]/65'
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Handwritten motivational quote */}
            <p className="font-hand text-xl text-[#0F7A5A] mt-4 leading-snug">
              1 transaksi hari ini biar apinya nggak padam.
            </p>

            {/* Dotted Progress Bar towards 30 days */}
            <div className="mt-4 pt-3 border-t border-dashed border-[#11221B]/20">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[#11221B]/80">
                  Menuju <strong className="font-extrabold text-[#11221B]">30 hari</strong>
                </span>
                <span className="font-mono text-[11px] font-bold text-[#11221B]/65">
                  {Math.max(0, 30 - streakCount)} Lagi
                </span>
              </div>

              <div className="flex items-center justify-between gap-1">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 flex-1 rounded-full border border-[#11221B] ${
                      i < dotsFilled ? 'bg-[#FB923C]' : 'bg-white'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 mt-4">
                <span className="font-mono text-[11px] font-bold text-[#11221B]/70 leading-tight">
                  Total {state.transactions.length}
                  <br />
                  Transaksi
                </span>
                <button
                  type="button"
                  onClick={handleShareProgress}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border-2 border-[#11221B] shadow-[2px_2px_0px_0px_#11221B] hover:bg-[#CCF32F] text-xs font-extrabold text-[#11221B] transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan progres</span>
                </button>
              </div>
            </div>
          </div>

          {/* KARTU BAWAH: QUIZ / WALLET DIAGNOSTIC CARD with Stacked Card Effect Behind It */}
          <div className="relative pb-2 pr-2">
            {/* Back Stacked Layers */}
            <div className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-2xl bg-[#E9E7DF] border-2 border-[#11221B] pointer-events-none" />
            <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl bg-[#F3F2EC] border-2 border-[#11221B] pointer-events-none" />

            {/* Foreground Card */}
            <div className="relative bg-white border-2 border-[#11221B] rounded-2xl p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-[#0F7A5A] tracking-wide">
                  Cek Profil Kas &amp; Dompet
                </span>
                <span
                  id="dash-wallet-count"
                  className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#F8F7F2] border border-[#11221B]/30 text-[#11221B]"
                >
                  {state.wallets.length} Dompet
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-[#11221B] leading-snug">
                Sudah tahu distribusi kas &amp; rasio tabunganmu?
              </h3>

              <p className="text-xs text-[#11221B]/75 leading-relaxed">
                Pantau {state.wallets.length} dompet aktif, rasio pengeluaran, dan kesehatan kas bulananmu dalam satu tampilan.
              </p>

              {/* Row of 5 Circular Avatar/Icon Badges */}
              <div className="flex items-center gap-2.5 my-1">
                {[
                  { Icon: Building2, bg: 'bg-[#BAE6FD]', title: 'Rekening Bank' },
                  { Icon: Smartphone, bg: 'bg-[#D8B4FE]', title: 'E-Wallet' },
                  { Icon: Banknote, bg: 'bg-[#BBF7D0]', title: 'Uang Tunai' },
                  { Icon: PiggyBank, bg: 'bg-[#FEF08A]', title: 'Tabungan' },
                  { Icon: ShieldCheck, bg: 'bg-[#FED7AA]', title: 'Dana Aman' }
                ].map(({ Icon, bg, title }, idx) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => switchPage(idx < 3 ? 'wallets' : 'goals')}
                    title={title}
                    className={`w-10 h-10 rounded-full ${bg} border-2 border-[#11221B] flex items-center justify-center hover:-translate-y-0.5 transition-transform cursor-pointer`}
                  >
                    <Icon className="w-4 h-4 text-[#11221B]" />
                  </button>
                ))}
              </div>

              {/* Handwritten Note */}
              <p className="font-hand text-xl text-[#0F7A5A]">
                pos mana yang paling aktif?
              </p>

              {/* Outline Pill CTA Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => switchPage('wallets')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border-2 border-[#11221B] shadow-[2px_2px_0px_0px_#11221B] hover:bg-[#CCF32F] text-xs font-extrabold text-[#11221B] transition-colors cursor-pointer"
                >
                  <span>Cek Dompet &amp; Rasio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BUDGET ALERTS BANNER (If any budgets >= 80%) */}
      <div id="dash-budget-alerts" className={alerts.length > 0 ? 'flex flex-col gap-2' : 'hidden'}>
        {alerts.map(({ cat, pct, spent, limit }) => (
          <div
            key={cat.id}
            className={`px-4 py-3 rounded-2xl border-2 border-[#11221B] shadow-[3px_3px_0px_0px_#11221B] flex items-center justify-between gap-3 text-xs font-medium ${
              pct >= 100 ? 'bg-red-50 text-[#BA1A1A]' : 'bg-[#FEF08A] text-[#11221B]'
            }`}
          >
            <span>
              <strong>{pct >= 100 ? 'Anggaran Terlampaui:' : 'Peringatan Anggaran:'}</strong>{' '}
              <b>{cat.name}</b> sudah mencapai <b>{pct}%</b> ({formatIDR(spent)} dari {formatIDR(limit)})
            </span>
            <button
              type="button"
              onClick={() => switchPage('budgets')}
              className="px-3 py-1 rounded-full bg-white border border-[#11221B] font-bold text-[#11221B] cursor-pointer"
            >
              Atur
            </button>
          </div>
        ))}
      </div>

      {/* LOWER SECTION: RECENT TRANSACTIONS & ACTIVE WALLETS / BUDGET BARS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions (7 cols) */}
        <div className="lg:col-span-7">
          <WindowBox
            icon={Clock}
            title="RIWAYAT TRANSAKSI TERBARU"
            actions={
              <button
                type="button"
                className="win-badge-btn"
                onClick={() => switchPage('transactions')}
              >
                SEMUA TRANSAKSI →
              </button>
            }
          >
            <div id="dash-recent-tx">
              {recent.length ? (
                recent.map((tx) => <TxItem key={tx.id} tx={tx} />)
              ) : (
                <div className="empty-state">
                  Belum ada transaksi tercatat. Tekan tombol &quot;Catat Transaksi&quot; untuk mulai mencatat arus kas.
                </div>
              )}
            </div>
          </WindowBox>
        </div>

        {/* Active Wallets & Budget Bars (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <WindowBox
            color="mint"
            icon={Wallet}
            title="DAFTAR DOMPET AKTIF"
            actions={
              <button
                type="button"
                className="win-badge-btn"
                onClick={() => switchPage('wallets')}
              >
                KELOLA →
              </button>
            }
          >
            <div id="dash-wallets-list" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {state.wallets.map((w) => (
                <div
                  key={w.id}
                  onClick={() => switchPage('wallets')}
                  className="p-3.5 rounded-xl border-2 border-[#11221B] bg-[#F8F7F2] hover:bg-[#CCF32F]/30 shadow-[2px_2px_0px_0px_#11221B] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-[#11221B]">
                      {w.type}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#0F7A5A]" />
                  </div>
                  <h4 className="text-sm font-extrabold text-[#11221B] mt-2 truncate">
                    {w.name}
                  </h4>
                  <div className="font-mono text-sm font-extrabold text-[#11221B] mt-0.5">
                    {formatIDR(calculateWalletBalance(state, w.id))}
                  </div>
                </div>
              ))}
            </div>
          </WindowBox>

          <WindowBox
            color="sky"
            icon={PieChart}
            title="REALISASI ANGGARAN BULAN INI"
            actions={
              <button
                type="button"
                className="win-badge-btn"
                onClick={() => switchPage('budgets')}
              >
                ATUR →
              </button>
            }
          >
            <div id="dash-budget-bars">
              {budgets.length ? (
                budgets.map(({ cat, pct, spent, limit }) => {
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
                      <div className="budget-bar-label">
                        <span className="font-bold text-[#11221B]">{cat.name}</span>
                        <span>
                          {status} ({pct}%)
                        </span>
                      </div>
                      <div className="budget-bar-track">
                        <div
                          className={`budget-bar-fill ${fillClass}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="budget-bar-detail">
                        <span>Terpakai: {formatIDR(spent)}</span>
                        <span>Batas: {formatIDR(limit)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  Belum ada batas anggaran untuk {getMonthLabel(selectedMonth)}. Buka halaman Anggaran untuk menetapkan batas pengeluaran.
                </div>
              )}
            </div>
          </WindowBox>
        </div>
      </div>
    </div>
  );
}


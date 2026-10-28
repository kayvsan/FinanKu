import { router } from 'expo-router';
import {
  ArrowRight,
  Banknote,
  Building2,
  Check,
  Clock,
  Flame,
  PieChart,
  PiggyBank,
  Plus,
  Share2,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Screen } from '@/components/chrome';
import { BudgetBar, TxItem } from '@/components/finance-ui';
import { BadgeButton, EmptyState, HardShadow, RetroButton, Txt, WindowBox } from '@/components/ui';
import { useFinance } from '@/context/FinanceContext';
import { calculateTotalBalance, calculateWalletBalance, getBudgetStatuses, getMonthlySummary } from '@/lib/finance';
import { formatIDR, getMonthLabel, todayISO } from '@/lib/formatters';
import { colors } from '@/lib/theme';

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function CircularProgress({
  pct,
  label,
  size = 56,
  stroke = 5.5,
  color = colors.success,
}: {
  pct: number;
  label: string;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#E5E7EB"
          strokeWidth={stroke}
          strokeDasharray="4 2"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="monoBold" style={{ fontSize: 11 }}>{label}</Txt>
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { state, selectedMonth, openTransactionModal } = useFinance();
  const total = calculateTotalBalance(state);
  const cur = getMonthlySummary(state, selectedMonth);
  const budgets = getBudgetStatuses(state, selectedMonth);
  const alerts = budgets.filter(b => b.pct >= 80);
  const recent = useMemo(
    () => [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [state.transactions],
  );

  // 4 Financial Mission Checklist items derived from real state
  const hasWallets = state.wallets.length > 0;
  const hasMonthTx = useMemo(
    () => state.transactions.some(t => t.date && t.date.startsWith(selectedMonth)),
    [state.transactions, selectedMonth],
  );
  const hasBudgets = budgets.length > 0 && budgets.every(b => b.pct < 100);
  const hasGoals = state.goals.length > 0;

  const checklistItems = [
    {
      id: 1,
      title: 'Siapkan Dompet & Saldo Awal',
      status: hasWallets ? 'Selesai' : 'Mulai',
      done: hasWallets,
      action: () => router.push('/wallets'),
    },
    {
      id: 2,
      title: 'Catat Arus Kas Bulan Ini',
      status: hasMonthTx ? 'Selesai' : 'Berikutnya',
      done: hasMonthTx,
      action: () => openTransactionModal('expense'),
    },
    {
      id: 3,
      title: 'Disiplin Pos Anggaran Bulanan',
      status: hasBudgets ? 'Selesai' : 'Berikutnya',
      done: hasBudgets,
      action: () => router.navigate('/budgets'),
    },
    {
      id: 4,
      title: 'Alokasi Target Tabungan Impian',
      status: hasGoals ? 'Selesai' : '±3 Mnt',
      done: hasGoals,
      action: () => router.push('/goals'),
    },
  ];

  const completedSteps = checklistItems.filter(i => i.done).length;
  const firstIncomplete = checklistItems.findIndex(i => !i.done);
  const highlightedIndex = firstIncomplete === -1 ? 2 : firstIncomplete;

  // Streak & active transaction days calculation
  const txDatesSet = useMemo(
    () => new Set(state.transactions.map(t => t.date).filter(Boolean)),
    [state.transactions],
  );

  const activeDaysInMonth = useMemo(() => {
    const dates = new Set(
      state.transactions
        .filter(t => t.date && t.date.startsWith(selectedMonth))
        .map(t => t.date),
    );
    return dates.size;
  }, [state.transactions, selectedMonth]);

  const weekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
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
  const dotsFilled = Math.min(14, Math.max(1, Math.round((streakCount / 30) * 14)));

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
  const monthShortCode = selectedMonth.slice(5, 7);

  const shareProgress = async () => {
    const msg = `Progres Keuangan FinanKu (${getMonthLabel(selectedMonth)}): Saldo Aktif ${formatIDR(total)}, ${completedSteps}/4 Misi Selesai, ${streakCount} Catatan Aktif!`;
    try {
      await Share.share({ message: msg });
    } catch {
      // ignore dismissed share sheet
    }
  };

  return (
    <Screen>
      {/* 1. HERO MODULE CARD (Purple Header + Circular Progress + White Checklist Body) */}
      <HardShadow style={{ marginBottom: 18 }} contentStyle={{ overflow: 'hidden' }}>
        {/* Top / Left Purple Section */}
        <View style={st.heroPurple}>
          <View style={st.moduleBadge}>
            <Txt variant="monoBold" style={{ fontSize: 11 }}>Periode {monthShortCode}</Txt>
          </View>

          <View style={st.heroCircleWrap}>
            <CircularProgress pct={(completedSteps / 4) * 100} label={`${completedSteps}/4`} size={76} stroke={7} color={colors.navy} />
            <View style={{ flex: 1 }}>
              <Txt variant="monoBold" style={{ fontSize: 11, color: colors.navy }}>
                Status Kas · {getMonthLabel(selectedMonth)}
              </Txt>
              <Txt variant="display" style={{ fontSize: 24, marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>
                {formatIDR(total)}
              </Txt>
              <Txt variant="monoBold" style={{ fontSize: 11, marginTop: 2 }}>
                <Txt variant="monoBold" style={{ fontSize: 11, color: colors.success }}>+{formatIDR(cur.income)}</Txt>
                {'  ·  '}
                <Txt variant="monoBold" style={{ fontSize: 11, color: colors.error }}>-{formatIDR(cur.expense)}</Txt>
              </Txt>
            </View>
          </View>
        </View>

        {/* Bottom / Right White Checklist Section */}
        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ gap: 8 }}>
            {checklistItems.map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              return (
                <Pressable
                  key={item.id}
                  onPress={item.action}
                  accessibilityRole="button"
                  style={[st.checkRow, isHighlighted && st.checkRowHighlighted]}
                >
                  <View style={[
                    st.checkBox,
                    item.done ? st.checkBoxDone : isHighlighted ? st.checkBoxActive : st.checkBoxIdle,
                  ]}>
                    {item.done ? (
                      <Check size={14} color="#fff" strokeWidth={3} />
                    ) : (
                      <Txt variant="monoBold" style={{ fontSize: 11 }}>{item.id}</Txt>
                    )}
                  </View>
                  <Txt variant="bodyBold" style={{ fontSize: 13, flex: 1 }} numberOfLines={1}>
                    {item.title}
                  </Txt>
                  <Txt variant="monoBold" style={{ fontSize: 11, color: isHighlighted ? colors.navy : colors.muted }}>
                    {item.status}
                  </Txt>
                </Pressable>
              );
            })}
          </View>

          {/* Primary Pill CTA + Secondary Action */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <RetroButton
              label="Catat Transaksi →"
              variant="lime"
              onPress={() => openTransactionModal('expense')}
              style={{ flex: 1 }}
            />
            <RetroButton
              label="Pemasukan"
              icon={Plus}
              variant="secondary"
              onPress={() => openTransactionModal('income')}
            />
          </View>

          <Txt style={{ fontSize: 11, color: colors.muted }}>
            Data transaksi dan saldo dompet tersimpan otomatis lintas perangkat.
          </Txt>
        </View>
      </HardShadow>

      {/* 2. STREAK CARD with Floating 'Rekor Baru!' Badge */}
      <View style={{ position: 'relative', marginBottom: 18, marginTop: 6 }}>
        <HardShadow contentStyle={{ backgroundColor: '#FFFBF2', padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={st.fireBox}>
              <Flame size={28} color="#9A3412" fill="#EA580C" strokeWidth={2.2} />
            </View>
            <View>
              <Txt variant="monoBold" style={{ fontSize: 11, color: '#9A3412' }}>Streak Catat Kas</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Txt variant="monoBold" style={{ fontSize: 32, lineHeight: 36 }}>{streakCount}</Txt>
                <Txt variant="bodyBold" style={{ fontSize: 12, color: colors.muted }}>catatan aktif</Txt>
              </View>
            </View>
          </View>

          {/* 7 Day Circles (Min-Sab) */}
          <View style={st.weekRow}>
            {weekDays.map(d => (
              <View key={d.label} style={{ alignItems: 'center', gap: 4 }}>
                <View style={[
                  st.dayCircle,
                  d.active && { backgroundColor: '#FDBA74' },
                  d.isToday && { borderStyle: 'dashed', backgroundColor: '#fff', borderColor: colors.navy },
                ]}>
                  <Flame
                    size={14}
                    color={d.active ? '#9A3412' : colors.faint}
                    fill={d.active ? '#EA580C' : 'transparent'}
                  />
                </View>
                <Txt variant={d.isToday ? 'monoBold' : 'mono'} style={{ fontSize: 10 }}>
                  {d.label}
                </Txt>
              </View>
            ))}
          </View>

          <Txt variant="bodySemi" style={{ fontSize: 13, fontStyle: 'italic', color: colors.success }}>
            1 transaksi hari ini biar apinya nggak padam.
          </Txt>

          {/* Dotted Progress Bar towards 30 days */}
          <View style={st.streakFooter}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Txt style={{ fontSize: 12 }}>Menuju <Txt variant="bodyBold" style={{ fontSize: 12 }}>30 hari</Txt></Txt>
              <Txt variant="monoBold" style={{ fontSize: 11, color: colors.muted }}>{Math.max(0, 30 - streakCount)} Lagi</Txt>
            </View>

            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 12 }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    st.dotPill,
                    { backgroundColor: i < dotsFilled ? '#FB923C' : '#fff' },
                  ]}
                />
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt variant="monoBold" style={{ fontSize: 11, color: colors.muted }}>
                Total {state.transactions.length} Transaksi
              </Txt>
              <RetroButton label="Bagikan progres" icon={Share2} variant="secondary" small onPress={shareProgress} />
            </View>
          </View>
        </HardShadow>

        {/* Floating Badge overlapping top-right border */}
        <View style={st.rekorBadge}>
          <Txt variant="monoBold" style={{ fontSize: 10 }}>Rekor Baru!</Txt>
        </View>
      </View>

      {/* 3. STACKED DIAGNOSTIC / WALLET CARD */}
      <View style={{ position: 'relative', marginBottom: 22, paddingRight: 6, paddingBottom: 6 }}>
        <View style={st.stackBack2} />
        <View style={st.stackBack1} />
        <View style={st.stackFront}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt variant="monoBold" style={{ fontSize: 11, color: colors.success }}>Cek Profil Kas &amp; Dompet</Txt>
            <View style={st.walletCountBadge}>
              <Txt variant="monoBold" style={{ fontSize: 10 }}>{state.wallets.length} Dompet</Txt>
            </View>
          </View>

          <Txt variant="display" style={{ fontSize: 18 }}>
            Sudah tahu distribusi kas &amp; rasio tabunganmu?
          </Txt>
          <Txt style={{ fontSize: 12, color: colors.muted }}>
            Pantau {state.wallets.length} dompet aktif, rasio pengeluaran, dan kesehatan kas bulananmu dalam satu tampilan.
          </Txt>

          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 4 }}>
            {[
              { Icon: Building2, bg: colors.sky, route: '/wallets' as const },
              { Icon: Smartphone, bg: colors.lavender, route: '/wallets' as const },
              { Icon: Banknote, bg: colors.mint, route: '/wallets' as const },
              { Icon: PiggyBank, bg: colors.butter, route: '/goals' as const },
              { Icon: ShieldCheck, bg: colors.peach, route: '/budgets' as const },
            ].map(({ Icon, bg, route }, i) => (
              <Pressable
                key={i}
                onPress={() => router.push(route)}
                style={[st.avatarIconCircle, { backgroundColor: bg }]}
                accessibilityRole="button"
              >
                <Icon size={16} color={colors.navy} strokeWidth={2.2} />
              </Pressable>
            ))}
          </View>

          <Txt variant="bodySemi" style={{ fontSize: 13, fontStyle: 'italic', color: colors.success }}>
            pos mana yang paling aktif?
          </Txt>

          <View style={{ alignSelf: 'flex-start', marginTop: 2 }}>
            <RetroButton label="Cek Dompet & Rasio →" variant="secondary" small onPress={() => router.push('/wallets')} />
          </View>
        </View>
      </View>

      {/* 4. BOTTOM OVERALL PROGRESS CARD */}
      <HardShadow style={{ marginBottom: 18 }} contentStyle={{ padding: 16, gap: 12 }}>
        <View style={st.championHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            <Txt variant="monoBold" style={{ fontSize: 22 }}>{overallChampionPct}%</Txt>
            <Txt variant="bodyBold" style={{ fontSize: 12, color: colors.success }}>
              menuju Financial Champion
            </Txt>
          </View>
          <Pressable onPress={() => router.push('/analytics')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Txt variant="bodyBold" style={{ fontSize: 11 }}>Lihat Laporan</Txt>
            <ArrowRight size={13} color={colors.navy} />
          </Pressable>
        </View>

        <View style={{ gap: 12 }}>
          <Pressable onPress={() => router.navigate('/budgets')} style={st.progressItem}>
            <CircularProgress pct={budgetHealthPct} label="01" color={colors.success} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyBold" style={{ fontSize: 14 }}>Fundamental Anggaran</Txt>
              <Txt variant="mono" style={{ fontSize: 11, color: colors.muted }}>
                {budgetHealthPct}% · {budgets.filter(b => b.pct < 80).length}/{Math.max(budgets.length, 1)} Pos Aman
              </Txt>
            </View>
          </Pressable>

          <Pressable onPress={() => router.push('/goals')} style={st.progressItem}>
            <CircularProgress pct={goalProgressPct} label="02" color="#EA580C" />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyBold" style={{ fontSize: 14 }}>Target Tabungan &amp; Aset</Txt>
              <Txt variant="mono" style={{ fontSize: 11, color: colors.muted }}>
                {goalProgressPct}% · {state.goals.length} Target Aktif
              </Txt>
            </View>
          </Pressable>
        </View>
      </HardShadow>

      {/* BUDGET ALERTS */}
      {alerts.map(({ cat, pct, spent, limit }) => (
        <Pressable
          key={cat.id}
          onPress={() => router.navigate('/budgets')}
          style={[st.alert, { backgroundColor: pct >= 100 ? '#ffe3f2' : colors.butter, borderColor: pct >= 100 ? colors.error : colors.navy }]}
          accessibilityRole="button"
        >
          <Txt style={{ fontSize: 12, flex: 1 }}>
            <Txt variant="bodyBold" style={{ fontSize: 12 }}>{pct >= 100 ? 'Anggaran Terlampaui: ' : 'Peringatan: '}</Txt>
            <Txt variant="bodyBold" style={{ fontSize: 12 }}>{cat.name}</Txt> ({pct}% · {formatIDR(spent)} dari {formatIDR(limit)})
          </Txt>
          <Txt variant="monoBold" style={{ fontSize: 11 }}>Atur →</Txt>
        </Pressable>
      ))}

      {/* WALLETS HORIZONTAL LIST */}
      <WindowBox
        title="DAFTAR DOMPET AKTIF"
        icon={Wallet}
        color="mint"
        actions={<BadgeButton label="KELOLA →" onPress={() => router.push('/wallets')} />}
        bodyStyle={{ paddingHorizontal: 0 }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 12 }}>
          {state.wallets.map((w) => (
            <HardShadow key={w.id} style={{ width: 190 }} contentStyle={{ padding: 12, gap: 6, backgroundColor: colors.page }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={st.walletTypeTag}>
                  <Txt variant="monoBold" style={{ fontSize: 9 }}>{w.type.toUpperCase()}</Txt>
                </View>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
              </View>
              <Txt variant="bodyBold" style={{ fontSize: 14, marginTop: 2 }} numberOfLines={1}>{w.name}</Txt>
              <Txt variant="display" style={{ fontSize: 16 }} numberOfLines={1} adjustsFontSizeToFit>
                {formatIDR(calculateWalletBalance(state, w.id))}
              </Txt>
            </HardShadow>
          ))}
        </ScrollView>
      </WindowBox>

      {/* RECENT TRANSACTIONS */}
      <WindowBox
        title="RIWAYAT TRANSAKSI TERBARU"
        icon={Clock}
        color="page"
        actions={<BadgeButton label="SEMUA →" onPress={() => router.navigate('/transactions')} />}
        bodyStyle={{ paddingTop: 4 }}
      >
        {recent.length ? recent.map(tx => <TxItem key={tx.id} tx={tx} />) : (
          <EmptyState text='Belum ada transaksi tercatat. Tekan tombol "+" untuk mulai.' />
        )}
      </WindowBox>

      {/* BUDGET BARS */}
      <WindowBox
        title="REALISASI ANGGARAN BULAN INI"
        icon={PieChart}
        color="sky"
        actions={<BadgeButton label="ATUR →" onPress={() => router.navigate('/budgets')} />}
      >
        {budgets.length ? budgets.map(b => <BudgetBar key={b.cat.id} name={b.cat.name} pct={b.pct} spent={b.spent} limit={b.limit} />) : (
          <EmptyState text={`Belum ada anggaran yang diatur untuk ${getMonthLabel(selectedMonth)}. Buka tab Anggaran untuk mengatur batas.`} />
        )}
      </WindowBox>
    </Screen>
  );
}

const st = StyleSheet.create({
  heroPurple: {
    backgroundColor: colors.lavender,
    borderBottomWidth: 2,
    borderBottomColor: colors.navy,
    padding: 16,
    gap: 12,
  },
  moduleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.navy,
    borderRadius: 10,
    transform: [{ rotate: '-2deg' }],
  },
  heroCircleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.88)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.navy,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  checkRowHighlighted: {
    backgroundColor: '#F4F9D9',
    borderColor: colors.navy,
    borderWidth: 2,
  },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxDone: {
    backgroundColor: colors.navy,
    borderWidth: 2,
    borderColor: colors.navy,
  },
  checkBoxActive: {
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.navy,
  },
  checkBoxIdle: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.hairline,
  },
  rekorBadge: {
    position: 'absolute',
    top: -10,
    right: 18,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.navy,
  },
  fireBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FDBA74',
    borderWidth: 2,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakFooter: {
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderTopColor: colors.hairline,
  },
  dotPill: {
    flex: 1,
    height: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  stackBack2: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: '#E9E7DF',
    borderWidth: 2,
    borderColor: colors.navy,
  },
  stackBack1: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 3,
    bottom: 3,
    borderRadius: 16,
    backgroundColor: '#F3F2EC',
    borderWidth: 2,
    borderColor: colors.navy,
  },
  stackFront: {
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.navy,
    padding: 16,
    gap: 8,
  },
  walletCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.page,
    borderWidth: 1,
    borderColor: colors.navy,
  },
  avatarIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  championHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.hairline,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 2,
    borderRadius: 14,
    marginBottom: 12,
  },
  walletTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.navy,
  },
});


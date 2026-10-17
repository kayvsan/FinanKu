import { router } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bookmark,
  Clock,
  Cpu,
  CreditCard,
  MinusCircle,
  PieChart,
  PlusCircle,
  Scale,
  ShieldCheck,
  Wallet,
} from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/chrome';
import { BudgetBar, KpiCard, TxItem } from '@/components/finance-ui';
import { BadgeButton, EmptyState, HardShadow, RetroButton, TagPill, Txt, WindowBox } from '@/components/ui';
import { useFinance } from '@/context/FinanceContext';
import { calculateTotalBalance, calculateWalletBalance, getBudgetStatuses, getMonthlySummary } from '@/lib/finance';
import { formatIDR, getMonthLabel, getPrevMonth } from '@/lib/formatters';
import { colors, type Pastel } from '@/lib/theme';

const STRIP_COLORS: Record<string, Pastel> = { Bank: 'sky', 'E-Wallet': 'lavender', Tunai: 'mint' };

function calcDiff(now: number, old: number) {
  if (old === 0) return now > 0 ? '★ NAIK 100% DARI BLN LALU' : '★ BELUM ADA DATA LALU';
  const pct = Math.round(((now - old) / old) * 100);
  return `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct)}% DIBANDING BLN LALU`;
}

export default function DashboardScreen() {
  const { state, selectedMonth, openTransactionModal } = useFinance();
  const total = calculateTotalBalance(state);
  const cur = getMonthlySummary(state, selectedMonth);
  const prev = getMonthlySummary(state, getPrevMonth(selectedMonth));
  const budgets = getBudgetStatuses(state, selectedMonth);
  const alerts = budgets.filter(b => b.pct >= 80);
  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <Screen>
      {/* HERO: SOROTAN_UTAMA.EXE */}
      <WindowBox title="SOROTAN_UTAMA.EXE" icon={Cpu} actions={<Txt variant="monoBold" style={{ fontSize: 10, opacity: 0.75, marginRight: 4 }}>1 / 4</Txt>}>
        <TagPill label="✦ FINTRACK OS" />
        <Txt variant="display" style={st.heroTitle}>SALDO TOTAL KEUANGAN</Txt>
        <Txt style={st.heroSub}>Akumulasi seluruh aset likuid aktif dan status perputaran kas bulan {getMonthLabel(selectedMonth)}</Txt>
        <Txt variant="display" style={st.heroPrice} numberOfLines={1} adjustsFontSizeToFit>{formatIDR(total)}</Txt>
        <View style={st.heroStatus}>
          <Txt variant="monoBold" style={{ fontSize: 11 }}>{state.wallets.length} Dompet Aktif</Txt>
          <Txt variant="monoBold" style={{ fontSize: 11, color: colors.success }}>● AKTIF</Txt>
        </View>
        <View style={st.heroBtns}>
          <RetroButton label="CATAT PENGELUARAN" icon={MinusCircle} variant="butter" small onPress={() => openTransactionModal('expense')} />
          <RetroButton label="CATAT PEMASUKAN" icon={PlusCircle} variant="secondary" small onPress={() => openTransactionModal('income')} />
          <RetroButton label="KELOLA DOMPET" icon={Wallet} variant="secondary" small onPress={() => router.push('/wallets')} />
        </View>
      </WindowBox>

      {/* KPI CARDS */}
      <KpiCard
        strip="mint" label="ARUS_MASUK.LOG" badge="PEMASUKAN" icon={ArrowDownLeft} pill="⏱ BULAN INI"
        value={formatIDR(cur.income)} valueColor={colors.success} footer={calcDiff(cur.income, prev.income)}
      />
      <KpiCard
        strip="bubblegum" label="ARUS_KELUAR.LOG" badge="PENGELUARAN" icon={ArrowUpRight} pill="⚡ REAL-TIME"
        value={formatIDR(cur.expense)} valueColor={colors.error} footer={calcDiff(cur.expense, prev.expense)}
      />
      <KpiCard
        strip="sky" label="NERACA_BERSIH.CALC" badge="SELISIH" icon={Scale} pill="⚖️ STATUS KAS"
        value={(cur.net >= 0 ? '+' : '') + formatIDR(cur.net)} valueColor={cur.net >= 0 ? colors.success : colors.error}
        footer={cur.net >= 0 ? '★ SURPLUS BULAN INI' : '★ DEFISIT BULAN INI'}
      />
      <KpiCard
        strip="peach" label="KESEHATAN_KAS.SYS" badge="DISIPLIN" icon={ShieldCheck} pill="🛡️ KENDALI"
        value={alerts.length ? 'PERHATIAN' : 'TERKENDALI'} valueColor={alerts.length ? colors.error : colors.navy}
        footer={alerts.length ? `★ ${alerts.length} ANGGARAN OVER LIMIT` : '★ SEMUA ANGGARAN AMAN'}
      />

      {/* BUDGET ALERTS */}
      {alerts.map(({ cat, pct, spent, limit }) => (
        <Pressable
          key={cat.id}
          onPress={() => router.navigate('/budgets')}
          style={[st.alert, { backgroundColor: pct >= 100 ? '#ffe3f2' : '#fff8d6', borderColor: pct >= 100 ? colors.error : colors.navy }]}
          accessibilityRole="button"
        >
          <Txt style={{ fontSize: 12, flex: 1 }}>
            <Txt variant="bodyBold" style={{ fontSize: 12 }}>{pct >= 100 ? 'Anggaran Terlampaui: ' : 'Peringatan: '}</Txt>
            <Txt variant="bodyBold" style={{ fontSize: 12 }}>{cat.name}</Txt> {pct >= 100 ? 'sudah' : 'sudah terpakai'} {pct}% ({formatIDR(spent)} dari {formatIDR(limit)})
          </Txt>
          <Txt variant="monoBold" style={{ fontSize: 11 }}>Cek →</Txt>
        </Pressable>
      ))}

      {/* WALLETS */}
      <WindowBox
        title="DOMPET_DAN_REKENING.DAT"
        icon={CreditCard}
        showControls={false}
        actions={<BadgeButton label="LIHAT SEMUA →" onPress={() => router.push('/wallets')} />}
        bodyStyle={{ paddingHorizontal: 0 }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 12 }}>
          {state.wallets.map((w, idx) => (
            <HardShadow key={w.id} style={{ width: 200 }} contentStyle={{ overflow: 'hidden' }}>
              <View style={[st.walletStrip, { backgroundColor: colors[STRIP_COLORS[w.type] || 'sky'] }]}>
                <Txt variant="monoBold" style={{ fontSize: 10, flex: 1 }}>{w.type.toUpperCase()}</Txt>
                <Bookmark size={13} color={colors.navy} />
              </View>
              <View style={{ padding: 12, gap: 6 }}>
                <TagPill label={`★ DOMPET ${idx + 1}`} />
                <Txt variant="bodyBold" style={{ fontSize: 15 }} numberOfLines={1}>{w.name}</Txt>
                <Txt variant="display" style={{ fontSize: 17 }} numberOfLines={1} adjustsFontSizeToFit>{formatIDR(calculateWalletBalance(state, w.id))}</Txt>
              </View>
            </HardShadow>
          ))}
        </ScrollView>
      </WindowBox>

      {/* RECENT TRANSACTIONS */}
      <WindowBox
        title="TRANSAKSI_TERBARU.LOG"
        icon={Clock}
        showControls={false}
        actions={<BadgeButton label="SEMUA →" onPress={() => router.navigate('/transactions')} />}
        bodyStyle={{ paddingTop: 4 }}
      >
        {recent.length ? recent.map(tx => <TxItem key={tx.id} tx={tx} />) : (
          <EmptyState text='Belum ada transaksi tercatat. Tekan tombol "+" untuk mulai.' />
        )}
      </WindowBox>

      {/* BUDGET BARS */}
      <WindowBox
        title="PANTAUAN_ANGGARAN.SYS"
        icon={PieChart}
        color="sky"
        showControls={false}
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
  heroTitle: { fontSize: 24, marginTop: 10, marginBottom: 4, letterSpacing: -0.3 },
  heroSub: { fontSize: 12, color: 'rgba(27,27,58,0.65)', marginBottom: 8 },
  heroPrice: { fontSize: 32, letterSpacing: -0.5, marginBottom: 8 },
  heroStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 6,
    backgroundColor: colors.mint,
    marginBottom: 12,
  },
  heroBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderWidth: 1.5,
    borderRadius: 6,
    marginBottom: 10,
  },
  walletStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.navy,
  },
});

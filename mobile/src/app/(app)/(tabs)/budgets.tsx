import { PieChart } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/chrome';
import { LEVEL_LABEL, ProgressTrack } from '@/components/finance-ui';
import { RupiahField } from '@/components/forms';
import { Chip, HardShadow, RetroButton, Txt, WindowBox } from '@/components/ui';
import { useFinance } from '@/context/FinanceContext';
import { budgetLevel, getMonthlySummary } from '@/lib/finance';
import { formatIDR, formatRupiahString, getMonthLabel, parseRupiahInput } from '@/lib/formatters';
import { colors } from '@/lib/theme';
import type { Category } from '@/lib/types';

const LEVEL_CHIP = { safe: 'mint', warn: 'butter', over: 'bubblegum' } as const;

function BudgetCard({ cat, limit, spent }: { cat: Category; limit: number; spent: number }) {
  const { saveCategoryBudget, isBusy } = useFinance();
  const [input, setInput] = useState(limit > 0 ? formatRupiahString(limit) : '');
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const level = budgetLevel(pct);
  const saving = isBusy(`budget-${cat.id}`);

  return (
    <HardShadow style={{ marginBottom: 14 }} contentStyle={{ padding: 12, gap: 8 }}>
      <View style={st.head}>
        <Txt variant="bodyBold" style={{ fontSize: 14, flex: 1 }}>{cat.name}</Txt>
        {limit > 0 ? <Chip label={`${LEVEL_LABEL[level]} (${pct}%)`} color={LEVEL_CHIP[level]} /> : (
          <Txt variant="mono" style={{ fontSize: 11, color: colors.faint }}>Belum Diatur</Txt>
        )}
      </View>
      <ProgressTrack pct={limit > 0 ? pct : 0} level={level} />
      <View style={st.head}>
        <Txt style={st.small}>Realisasi: <Txt variant="bodyBold" style={[st.small, { color: colors.navy }]}>{formatIDR(spent)}</Txt></Txt>
        <Txt style={st.small}>Sisa: <Txt variant="bodyBold" style={st.small}>{limit > 0 ? formatIDR(Math.max(limit - spent, 0)) : '-'}</Txt></Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <RupiahField value={input} onChange={setInput} placeholder="Atur batas anggaran..." />
        </View>
        <RetroButton label={saving ? '...' : 'Simpan'} small loading={saving} onPress={() => saveCategoryBudget(cat.id, parseRupiahInput(input))} />
      </View>
    </HardShadow>
  );
}

export default function BudgetsScreen() {
  const { state, selectedMonth } = useFinance();
  const cur = getMonthlySummary(state, selectedMonth);
  const monthBudgets = state.budgets[selectedMonth] || {};
  const rows = state.categories.filter(c => c.type === 'expense').map(cat => ({
    cat,
    limit: Number(monthBudgets[cat.id]) || 0,
    spent: cur.byCategory[cat.id] || 0,
  }));
  const budgeted = rows.filter(r => r.limit > 0);
  const totalBudget = budgeted.reduce((a, r) => a + r.limit, 0);
  const totalSpent = budgeted.reduce((a, r) => a + r.spent, 0);

  return (
    <Screen>
      <WindowBox title="BATAS ANGGARAN BULANAN" icon={PieChart}>
        <Txt variant="display" style={{ fontSize: 16 }}>Pantauan Batas Pengeluaran per Kategori</Txt>
        <Txt variant="mono" style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
          Periode {getMonthLabel(selectedMonth)} · Aman (&lt;80%) · Hampir Habis (80-100%) · Terlampaui (&gt;100%)
        </Txt>
        <View style={st.total}>
          <Txt variant="monoBold" style={{ fontSize: 10, color: colors.muted }}>TOTAL ANGGARAN VS REALISASI</Txt>
          <Txt variant="display" style={{ fontSize: 18 }}>{formatIDR(totalSpent)} / {formatIDR(totalBudget)}</Txt>
        </View>
      </WindowBox>
      {/* key includes the month and limit so the input resets after saving or switching months */}
      {rows.map(r => <BudgetCard key={`${selectedMonth}-${r.cat.id}-${r.limit}`} {...r} />)}
    </Screen>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  small: { fontSize: 11, color: colors.muted },
  total: { marginTop: 12, paddingTop: 10, borderTopWidth: 1.5, borderTopColor: colors.hairline, gap: 2 },
});

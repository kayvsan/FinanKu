import { router } from 'expo-router';
import { PieChart, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/chrome';
import { BarChart, CHART_PALETTE, DonutChart } from '@/components/finance-ui';
import { EmptyState, Txt, WindowBox } from '@/components/ui';
import { useFinance } from '@/context/FinanceContext';
import { getCategoryById, getMonthlySummary } from '@/lib/finance';
import { formatIDR, getMonthLabel, getPrevMonth } from '@/lib/formatters';
import { colors } from '@/lib/theme';

const RANGES = [3, 6, 12];

export default function AnalyticsScreen() {
  const { state, selectedMonth, setTxFilters } = useFinance();
  const [range, setRange] = useState(6);
  const [chartWidth, setChartWidth] = useState(0);

  const cur = getMonthlySummary(state, selectedMonth);
  const entries = Object.entries(cur.byCategory).sort((a, b) => b[1] - a[1]);

  const months: string[] = [];
  let ptr = selectedMonth;
  for (let i = 0; i < range; i++) {
    months.unshift(ptr);
    ptr = getPrevMonth(ptr);
  }
  const summaries = months.map(m => getMonthlySummary(state, m));

  // Like filterTransactionsByCategory() in the original
  const openCategory = (catId: string) => {
    setTxFilters(f => ({ ...f, category: catId }));
    router.navigate('/transactions');
  };

  return (
    <Screen back>
      <WindowBox title="DISTRIBUSI PENGELUARAN" icon={PieChart}>
        {entries.length === 0 ? (
          <EmptyState text="Belum ada pengeluaran pada bulan ini." />
        ) : (
          <>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <DonutChart values={entries.map(([, v]) => v)} />
            </View>
            {entries.map(([cid, val], i) => (
              <Pressable key={cid} onPress={() => openCategory(cid)} style={({ pressed }) => [st.row, pressed && { backgroundColor: colors.page }]} accessibilityRole="button">
                <View style={[st.swatch, { backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }]} />
                <Txt variant="bodySemi" style={{ flex: 1, fontSize: 13 }} numberOfLines={1}>{getCategoryById(state, cid).name}</Txt>
                <Txt variant="display" style={{ fontSize: 13 }}>{formatIDR(val)}</Txt>
                <Txt variant="mono" style={{ fontSize: 11, color: colors.faint, width: 42, textAlign: 'right' }}>
                  ({Math.round((val / cur.expense) * 100)}%)
                </Txt>
              </Pressable>
            ))}
            <Txt variant="mono" style={{ fontSize: 10, color: colors.muted, marginTop: 8 }}>Ketuk kategori untuk melihat transaksinya.</Txt>
          </>
        )}
      </WindowBox>

      <WindowBox title="TREN ARUS KAS" icon={TrendingUp} color="sky" showControls={false}
        actions={
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {RANGES.map(r => (
              <Pressable key={r} onPress={() => setRange(r)} style={[st.range, range === r && { backgroundColor: colors.lime }]} accessibilityRole="button">
                <Txt variant="monoBold" style={{ fontSize: 10 }}>{r}B</Txt>
              </Pressable>
            ))}
          </View>
        }
      >
        <View style={st.legend}>
          <View style={[st.swatch, { backgroundColor: colors.mint }]} /><Txt style={{ fontSize: 11 }}>Pemasukan</Txt>
          <View style={[st.swatch, { backgroundColor: colors.bubblegum, marginLeft: 10 }]} /><Txt style={{ fontSize: 11 }}>Pengeluaran</Txt>
        </View>
        <View onLayout={e => setChartWidth(e.nativeEvent.layout.width)}>
          {chartWidth > 0 && (
            <BarChart
              width={chartWidth}
              labels={months.map(m => getMonthLabel(m).slice(0, 3) + ' ' + m.slice(2, 4))}
              series={[
                { label: 'Pemasukan', color: colors.mint, values: summaries.map(s => s.income) },
                { label: 'Pengeluaran', color: colors.bubblegum, values: summaries.map(s => s.expense) },
              ]}
            />
          )}
        </View>
        <View style={st.compare}>
          {[
            ['Pemasukan', cur.income, colors.success],
            ['Pengeluaran', cur.expense, colors.error],
            ['Selisih', cur.net, cur.net >= 0 ? colors.success : colors.error],
          ].map(([label, value, color]) => (
            <View key={label as string} style={{ flex: 1, alignItems: 'center' }}>
              <Txt variant="mono" style={{ fontSize: 10, color: colors.muted }}>{label as string}</Txt>
              <Txt variant="display" style={{ fontSize: 12, color: color as string }} numberOfLines={1} adjustsFontSizeToFit>
                {formatIDR(value as number)}
              </Txt>
            </View>
          ))}
        </View>
      </WindowBox>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    borderRadius: 4,
  },
  swatch: { width: 14, height: 14, borderWidth: 1.5, borderColor: colors.navy, borderRadius: 3 },
  range: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1.5, borderColor: colors.navy, borderRadius: 4, backgroundColor: '#fff' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8, justifyContent: 'center' },
  compare: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: colors.hairline,
  },
});

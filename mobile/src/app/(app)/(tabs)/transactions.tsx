import { Filter, List, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/chrome';
import { TxItem } from '@/components/finance-ui';
import { DateField, Field, SelectField, TextField } from '@/components/forms';
import { EmptyState, RetroButton, Txt, WindowBox } from '@/components/ui';
import { useFinance, type TxFilters } from '@/context/FinanceContext';
import { getCategoryById } from '@/lib/finance';
import { colors } from '@/lib/theme';

const TYPE_OPTIONS: { value: TxFilters['type']; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'expense', label: 'Keluar' },
  { value: 'income', label: 'Masuk' },
  { value: 'transfer', label: 'Transfer' },
];

export default function TransactionsScreen() {
  const { state, txFilters, setTxFilters, resetTransactionFilters, txDisplayLimit, loadMoreTransactions } = useFinance();
  const [showMore, setShowMore] = useState(false);
  const { search, type, category, wallet, start, end } = txFilters;
  const set = <K extends keyof TxFilters>(key: K) => (v: TxFilters[K]) => setTxFilters(f => ({ ...f, [key]: v }));

  const q = search.toLowerCase();
  const filtered = state.transactions
    .filter(tx => {
      if (type !== 'all' && tx.type !== type) return false;
      if (category !== 'all' && tx.categoryId !== category) return false;
      if (wallet !== 'all' && tx.walletId !== wallet && tx.toWalletId !== wallet) return false;
      if (start && tx.date < start) return false;
      if (end && tx.date > end) return false;
      if (q) {
        const hit = (tx.note || '').toLowerCase().includes(q)
          || (tx.tag || '').toLowerCase().includes(q)
          || getCategoryById(state, tx.categoryId).name.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  const slice = filtered.slice(0, txDisplayLimit);
  const activeExtra = [category !== 'all', wallet !== 'all', !!start, !!end].filter(Boolean).length;

  return (
    <Screen>
      <WindowBox title="FILTER_DAN_PENCARIAN.EXE" icon={Filter}>
        <View style={{ justifyContent: 'center', marginBottom: 10 }}>
          <View style={st.searchIcon}><Search size={16} color={colors.muted} /></View>
          <TextField value={search} onChangeText={set('search')} placeholder="Cari catatan atau #tag..." autoCapitalize="none" style={{ paddingLeft: 36 }} />
        </View>
        <View style={st.typeRow}>
          {TYPE_OPTIONS.map(o => {
            const active = type === o.value;
            return (
              <Pressable key={o.value} onPress={() => set('type')(o.value)} style={[st.typeChip, active && st.typeChipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
                <Txt variant={active ? 'bodyBold' : 'bodySemi'} style={{ fontSize: 12 }}>{o.label}</Txt>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => setShowMore(v => !v)} style={st.moreToggle} accessibilityRole="button">
          <Txt variant="monoBold" style={{ fontSize: 11 }}>
            {showMore ? '▴ SEMBUNYIKAN FILTER' : `▾ FILTER LAINNYA${activeExtra ? ` (${activeExtra} aktif)` : ''}`}
          </Txt>
        </Pressable>

        {showMore && (
          <View style={{ marginTop: 10 }}>
            <Field label="Kategori">
              <SelectField
                value={category}
                onChange={set('category')}
                title="FILTER_KATEGORI.EXE"
                options={[{ value: 'all', label: 'Semua Kategori' }, ...state.categories.map(c => ({ value: c.id, label: c.name }))]}
              />
            </Field>
            <Field label="Dompet">
              <SelectField
                value={wallet}
                onChange={set('wallet')}
                title="FILTER_DOMPET.EXE"
                options={[{ value: 'all', label: 'Semua Dompet' }, ...state.wallets.map(w => ({ value: w.id, label: w.name }))]}
              />
            </Field>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Field label="Dari" style={{ flex: 1 }}><DateField value={start} onChange={set('start')} optional placeholder="Awal" /></Field>
              <Field label="Sampai" style={{ flex: 1 }}><DateField value={end} onChange={set('end')} optional placeholder="Akhir" /></Field>
            </View>
          </View>
        )}

        <View style={st.countRow}>
          <Txt variant="monoBold" style={{ fontSize: 11, flex: 1 }}>
            Menampilkan {Math.min(filtered.length, txDisplayLimit)} dari {filtered.length} transaksi
          </Txt>
          <RetroButton label="Reset" variant="secondary" small onPress={resetTransactionFilters} />
        </View>
      </WindowBox>

      <WindowBox title="RIWAYAT_TRANSAKSI.LOG" icon={List} color="sky" bodyStyle={{ paddingTop: 2 }}>
        {slice.length ? slice.map(tx => <TxItem key={tx.id} tx={tx} />) : (
          <EmptyState text="Tidak ada transaksi yang cocok dengan filter. Coba ubah kata kunci atau rentang tanggal." />
        )}
        {filtered.length > txDisplayLimit && (
          <RetroButton label="Muat Lebih Banyak" variant="secondary" onPress={loadMoreTransactions} style={{ marginTop: 12 }} />
        )}
      </WindowBox>
    </Screen>
  );
}

const st = StyleSheet.create({
  searchIcon: { position: 'absolute', left: 12, zIndex: 1 },
  typeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 999,
    backgroundColor: colors.panel,
  },
  typeChipActive: { backgroundColor: colors.butter, borderWidth: 2 },
  moreToggle: { marginTop: 10, alignSelf: 'flex-start', paddingVertical: 4 },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: colors.hairline,
  },
});

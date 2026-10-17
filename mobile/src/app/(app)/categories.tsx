import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Tags, Trash2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/chrome';
import { IconButton, RetroButton, Txt, WindowBox, type IconType } from '@/components/ui';
import { useFinance } from '@/context/FinanceContext';
import { colors } from '@/lib/theme';
import type { CategoryType } from '@/lib/types';

export default function CategoriesScreen() {
  const { state, openCategoryModal, tryDeleteCategory, isBusy } = useFinance();

  const section = (type: CategoryType, label: string, Icon: IconType, color: string) => (
    <View style={{ marginBottom: 18 }}>
      <View style={st.sectionHead}>
        <Icon size={16} color={color} strokeWidth={2.4} />
        <Txt variant="display" style={{ fontSize: 15, color }}>{label}</Txt>
      </View>
      {state.categories.filter(c => c.type === type).map(c => {
        const count = state.transactions.filter(t => t.categoryId === c.id).length;
        const deleting = isBusy(`cat-del-${c.id}`);
        return (
          <View key={c.id} style={[st.item, deleting && { opacity: 0.45 }]}>
            <View style={{ flex: 1 }}>
              <Txt variant="bodySemi" style={{ fontSize: 14 }}>{c.name}</Txt>
              <Txt variant="mono" style={{ fontSize: 11, color: colors.muted }}>({count} transaksi)</Txt>
            </View>
            <IconButton icon={Pencil} label={`Edit ${c.name}`} onPress={() => openCategoryModal(c)} disabled={deleting} />
            <IconButton icon={Trash2} label={`Hapus ${c.name}`} danger onPress={() => tryDeleteCategory(c.id)} disabled={deleting} />
          </View>
        );
      })}
    </View>
  );

  return (
    <Screen back>
      <WindowBox title="KLASIFIKASI_KATEGORI.SYS" icon={Tags} color="lavender">
        <RetroButton label="TAMBAH KATEGORI" icon={Plus} variant="butter" small onPress={() => openCategoryModal()} style={{ alignSelf: 'flex-start', marginBottom: 14 }} />
        {section('expense', 'Kategori Pengeluaran', ArrowUpRight, colors.error)}
        {section('income', 'Kategori Pemasukan', ArrowDownLeft, colors.success)}
      </WindowBox>
    </Screen>
  );
}

const st = StyleSheet.create({
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
});

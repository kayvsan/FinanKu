import { Plus, Target, Trash2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/chrome';
import { ProgressTrack } from '@/components/finance-ui';
import { Chip, EmptyState, HardShadow, IconButton, RetroButton, Txt, WindowBox } from '@/components/ui';
import { useFinance } from '@/context/FinanceContext';
import { getMonthlySummary } from '@/lib/finance';
import { formatIDR } from '@/lib/formatters';
import { colors } from '@/lib/theme';

export default function GoalsScreen() {
  const { state, selectedMonth, openGoalModal, openGoalAdjust, deleteGoal, isBusy } = useFinance();
  // Same estimate as the original: this month's surplus, at least Rp 1.000.000 per month
  const monthlySavingAvg = Math.max(getMonthlySummary(state, selectedMonth).net, 1000000);

  return (
    <Screen back>
      <WindowBox title="TARGET_TABUNGAN.OBJ" icon={Target} color="peach">
        <Txt variant="mono" style={{ fontSize: 11, color: colors.muted, marginBottom: 12 }}>
          Alokasikan dana ke target impian dan pantau estimasi tercapainya.
        </Txt>
        <RetroButton label="BUAT TARGET" icon={Plus} variant="butter" small onPress={openGoalModal} />
      </WindowBox>

      {state.goals.length === 0 && <EmptyState text="Belum ada target tabungan. Buat target pertama untuk mulai menabung." />}

      {state.goals.map(g => {
        const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
        const remaining = Math.max(0, g.target - g.saved);
        const estMonths = remaining > 0 ? Math.ceil(remaining / monthlySavingAvg) : 0;
        const adjusting = isBusy(`goal-adjust-${g.id}`);
        const deleting = isBusy(`goal-del-${g.id}`);
        return (
          <HardShadow key={g.id} style={[{ marginBottom: 14 }, deleting && { opacity: 0.45 }]} contentStyle={{ padding: 14, gap: 8 }}>
            <View style={st.head}>
              <Chip label={pct >= 100 ? '✓ Tercapai!' : `Progres ${pct}%`} color={pct >= 100 ? 'mint' : 'lavender'} />
              <IconButton icon={Trash2} label={`Hapus ${g.name}`} danger onPress={() => deleteGoal(g.id)} disabled={deleting} />
            </View>
            <Txt variant="display" style={{ fontSize: 18 }}>{g.name}</Txt>
            <Txt variant="mono" style={st.small}>{g.deadline ? `Target: ${g.deadline}` : 'Tanpa tenggat'}</Txt>
            <View style={st.head}>
              <Txt variant="display" style={{ fontSize: 14 }}>{formatIDR(g.saved)}</Txt>
              <Txt style={st.small}>dari {formatIDR(g.target)}</Txt>
            </View>
            <ProgressTrack pct={pct} level="safe" height={14} />
            <Txt variant="mono" style={st.small}>{remaining === 0 ? 'Target tabungan telah terpenuhi!' : `Estimasi: ~${estMonths} bulan lagi`}</Txt>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <RetroButton
                label={adjusting ? 'Menyimpan...' : '+ Tambah Dana'}
                variant="success"
                small
                loading={adjusting}
                onPress={() => openGoalAdjust(g, 1)}
                style={{ flex: 1 }}
              />
              <RetroButton label="- Tarik" variant="secondary" small disabled={adjusting} onPress={() => openGoalAdjust(g, -1)} />
            </View>
          </HardShadow>
        );
      })}
    </Screen>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  small: { fontSize: 11, color: colors.muted },
});

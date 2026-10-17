import { Pencil, Plus, Repeat, Trash2, Wallet } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/chrome';
import { Chip, HardShadow, IconButton, RetroButton, Txt, WindowBox } from '@/components/ui';
import { useFinance } from '@/context/FinanceContext';
import { calculateWalletBalance } from '@/lib/finance';
import { formatIDR } from '@/lib/formatters';
import { colors, type Pastel } from '@/lib/theme';

const BADGE: Record<string, Pastel> = { Bank: 'sky', 'E-Wallet': 'lavender', Tunai: 'mint' };

export default function WalletsScreen() {
  const { state, openTransactionModal, openWalletModal, deleteWallet, isBusy } = useFinance();

  return (
    <Screen back>
      <WindowBox title="MANAJEMEN_DOMPET.DAT" icon={Wallet}>
        <Txt variant="mono" style={{ fontSize: 11, color: colors.muted, marginBottom: 12 }}>
          Saldo dihitung otomatis dari saldo awal, seluruh pemasukan, pengeluaran, dan mutasi transfer antar rekening.
        </Txt>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <RetroButton label="TRANSFER" icon={Repeat} variant="secondary" small onPress={() => openTransactionModal('transfer')} style={{ flex: 1 }} />
          <RetroButton label="TAMBAH DOMPET" icon={Plus} variant="butter" small onPress={() => openWalletModal()} style={{ flex: 1 }} />
        </View>
      </WindowBox>

      {state.wallets.map(w => {
        const txCount = state.transactions.filter(t => t.walletId === w.id || t.toWalletId === w.id).length;
        const deleting = isBusy(`wallet-del-${w.id}`);
        return (
          <HardShadow key={w.id} style={[{ marginBottom: 14 }, deleting && { opacity: 0.45 }]} contentStyle={{ padding: 14, gap: 8 }}>
            <View style={st.head}>
              <Chip label={w.type} color={BADGE[w.type] || 'sky'} />
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <IconButton icon={Pencil} label={`Edit ${w.name}`} onPress={() => openWalletModal(w)} disabled={deleting} />
                <IconButton icon={Trash2} label={`Hapus ${w.name}`} danger onPress={() => deleteWallet(w.id)} disabled={deleting} />
              </View>
            </View>
            <Txt variant="bodyBold" style={{ fontSize: 16 }}>{w.name}</Txt>
            <Txt variant="display" style={{ fontSize: 24 }} numberOfLines={1} adjustsFontSizeToFit>{formatIDR(calculateWalletBalance(state, w.id))}</Txt>
            <View style={st.footer}>
              <Txt variant="mono" style={st.small}>Saldo Awal: {formatIDR(w.initialBalance)}</Txt>
              <Txt variant="mono" style={st.small}>{txCount} Transaksi</Txt>
            </View>
          </HardShadow>
        );
      })}
    </Screen>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: colors.hairline,
  },
  small: { fontSize: 11, color: colors.muted },
});

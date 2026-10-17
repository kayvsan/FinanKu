import { router, type Href } from 'expo-router';
import { ChevronRight, CreditCard, LogOut, Settings, Tags, Target, TrendingUp, User } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/chrome';
import { HardShadow, RetroButton, Txt, WindowBox, type IconType } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { confirmAsync } from '@/lib/dialogs';
import { colors, type Pastel } from '@/lib/theme';

const MENU: { href: Href; label: string; desc: string; icon: IconType; color: Pastel }[] = [
  { href: '/analytics', label: 'Analisis & Tren', desc: 'Distribusi pengeluaran & arus kas bulanan', icon: TrendingUp, color: 'sky' },
  { href: '/wallets', label: 'Dompet & Rekening', desc: 'Kelola dompet, saldo awal, transfer', icon: CreditCard, color: 'mint' },
  { href: '/goals', label: 'Target Tabungan', desc: 'Tambah & tarik dana target impian', icon: Target, color: 'peach' },
  { href: '/categories', label: 'Kategori', desc: 'Kategori pemasukan & pengeluaran', icon: Tags, color: 'lavender' },
  { href: '/settings', label: 'Pengaturan & Cadangan', desc: 'Ekspor/impor JSON, data contoh, reset', icon: Settings, color: 'butter' },
];

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!(await confirmAsync('Keluar dari akun ini?', { title: 'Keluar', confirmText: 'Keluar' }))) return;
    setLoggingOut(true);
    await logout();
  };

  return (
    <Screen>
      <WindowBox title="MENU_LAINNYA.EXE" icon={Settings} bodyStyle={{ gap: 12 }}>
        {MENU.map(item => {
          const Icon = item.icon;
          return (
            <Pressable key={item.label} onPress={() => router.push(item.href)} accessibilityRole="button" accessibilityLabel={item.label}>
              {({ pressed }) => (
                <HardShadow offset={pressed ? 1 : 3} contentStyle={[st.item, pressed && { backgroundColor: colors.page }]}>
                  <View style={[st.itemIcon, { backgroundColor: colors[item.color] }]}>
                    <Icon size={18} color={colors.navy} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyBold" style={{ fontSize: 15 }}>{item.label}</Txt>
                    <Txt style={{ fontSize: 12, color: colors.muted }}>{item.desc}</Txt>
                  </View>
                  <ChevronRight size={18} color={colors.navy} />
                </HardShadow>
              )}
            </Pressable>
          );
        })}
      </WindowBox>

      <WindowBox title="AKUN_PENGGUNA.SYS" icon={User} color="lavender">
        <Txt variant="monoBold" style={{ fontSize: 10, color: colors.muted }}>MASUK SEBAGAI</Txt>
        <Txt variant="display" style={{ fontSize: 20, marginBottom: 12 }}>{user?.username}</Txt>
        <RetroButton label={loggingOut ? 'Keluar...' : 'Keluar'} icon={LogOut} variant="danger" onPress={handleLogout} loading={loggingOut} />
      </WindowBox>
    </Screen>
  );
}

const st = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

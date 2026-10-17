import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { LayoutGrid, LayoutDashboard, ArrowLeftRight, PieChart, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt, type IconType } from '@/components/ui';
import { useFinance } from '@/context/FinanceContext';
import { colors } from '@/lib/theme';

// Same slots as the web app's mobile bottom nav: Beranda, Transaksi, (+), Anggaran, + "Lainnya" for the rest
const TABS: Record<string, { label: string; icon: IconType }> = {
  index: { label: 'Beranda', icon: LayoutDashboard },
  transactions: { label: 'Transaksi', icon: ArrowLeftRight },
  budgets: { label: 'Anggaran', icon: PieChart },
  more: { label: 'Lainnya', icon: LayoutGrid },
};

function RetroTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { openTransactionModal } = useFinance();

  const renderTab = (name: string) => {
    const index = state.routes.findIndex(r => r.name === name);
    if (index < 0) return null;
    const route = state.routes[index];
    const focused = state.index === index;
    const { label, icon: Icon } = TABS[name];
    const onPress = () => {
      // Same contract as the default BottomTabBar
      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigateToTab(route.key);
    };
    return (
      <Pressable
        key={name}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        style={[st.tab, focused && st.tabActive]}
      >
        <Icon size={20} color={colors.navy} strokeWidth={focused ? 2.6 : 2} />
        <Txt variant={focused ? 'bodyBold' : 'bodySemi'} style={st.tabLabel}>{label}</Txt>
      </Pressable>
    );
  };

  return (
    <View style={[st.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {renderTab('index')}
      {renderTab('transactions')}
      <Pressable
        onPress={() => openTransactionModal()}
        accessibilityRole="button"
        accessibilityLabel="Catat transaksi"
        style={({ pressed }) => [st.fab, pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] }]}
      >
        <Plus size={26} color={colors.navy} strokeWidth={2.8} />
      </Pressable>
      {renderTab('budgets')}
      {renderTab('more')}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={props => <RetroTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transaksi' }} />
      <Tabs.Screen name="budgets" options={{ title: 'Anggaran' }} />
      <Tabs.Screen name="more" options={{ title: 'Lainnya' }} />
    </Tabs>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 6,
    backgroundColor: colors.panel,
    borderTopWidth: 2,
    borderTopColor: colors.navy,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 5, borderRadius: 6, borderWidth: 1.5, borderColor: 'transparent' },
  tabActive: { backgroundColor: colors.butter, borderColor: colors.navy },
  tabLabel: { fontSize: 10 },
  fab: {
    width: 54,
    height: 54,
    marginTop: -26,
    marginHorizontal: 4,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.bubblegum,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

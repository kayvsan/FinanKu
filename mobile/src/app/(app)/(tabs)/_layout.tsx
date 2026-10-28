import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { LayoutGrid, ArrowLeftRight, PieChart, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt, type IconType } from '@/components/ui';
import { useFinance } from '@/context/FinanceContext';
import { colors } from '@/lib/theme';

// Same slots as the web app's mobile bottom nav: Beranda, Alur, (+), Anggaran, + "Lainnya" for the rest
const TABS: Record<string, { label: string; icon: IconType; bg: string }> = {
  index: { label: 'Beranda', icon: LayoutGrid, bg: colors.lime },
  transactions: { label: 'Alur', icon: ArrowLeftRight, bg: colors.sky },
  budgets: { label: 'Anggaran', icon: PieChart, bg: colors.butter },
  more: { label: 'Menu', icon: LayoutGrid, bg: colors.lavender },
};

function BentoTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { openTransactionModal } = useFinance();

  const renderTab = (name: string) => {
    const index = state.routes.findIndex(r => r.name === name);
    if (index < 0) return null;
    const route = state.routes[index];
    const focused = state.index === index;
    const { label, icon: Icon, bg } = TABS[name];
    const onPress = () => {
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
        <View style={[st.iconBox, { backgroundColor: bg }]}>
          <Icon size={15} color={colors.navy} strokeWidth={2.4} />
        </View>
        <Txt
          variant={focused ? 'bodyBold' : 'bodySemi'}
          style={[st.tabLabel, { color: focused ? '#fff' : colors.navy }]}
        >
          {label}
        </Txt>
      </Pressable>
    );
  };

  return (
    <View style={[st.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {renderTab('index')}
      {renderTab('transactions')}
      <View style={st.fabWrap}>
        <View style={st.fabShadow} />
        <Pressable
          onPress={() => openTransactionModal()}
          accessibilityRole="button"
          accessibilityLabel="Catat transaksi"
          style={({ pressed }) => [st.fab, pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] }]}
        >
          <Plus size={24} color={colors.navy} strokeWidth={2.8} />
        </Pressable>
      </View>
      {renderTab('budgets')}
      {renderTab('more')}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={props => <BentoTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Alur' }} />
      <Tabs.Screen name="budgets" options={{ title: 'Anggaran' }} />
      <Tabs.Screen name="more" options={{ title: 'Menu' }} />
    </Tabs>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.page,
    borderTopWidth: 2,
    borderTopColor: colors.navy,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tabActive: {
    backgroundColor: colors.navy,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { fontSize: 10 },
  fabWrap: {
    marginTop: -24,
    marginHorizontal: 6,
    position: 'relative',
  },
  fabShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.navy,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


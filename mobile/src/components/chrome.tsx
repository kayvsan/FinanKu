// App header and the scrolling screen wrapper used by every screen
import { router } from 'expo-router';
import { Bell, ChevronLeft, ChevronRight, User, Wallet } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { getMonthLabel } from '@/lib/formatters';
import { colors } from '@/lib/theme';
import { Txt } from './ui';

// Logo, budget bell, account pill and the month picker
export function AppHeader() {
  const { selectedMonth, changeGlobalMonth, budgetAlertCount } = useFinance();
  const { user } = useAuth();
  return (
    <View style={st.header}>
      <Pressable style={st.brand} onPress={() => router.navigate('/')} accessibilityRole="button" accessibilityLabel="Dashboard">
        <View style={st.logoIcon}><Wallet size={16} color={colors.navy} strokeWidth={2.4} /></View>
        <Txt variant="display" style={{ fontSize: 16 }}>
          FinTrack<Txt variant="display" style={{ fontSize: 16, color: colors.bubblegum }}>.id</Txt>
        </Txt>
      </Pressable>
      <View style={st.headerRight}>
        <Pressable
          style={st.iconPill}
          onPress={() => router.navigate('/budgets')}
          accessibilityRole="button"
          accessibilityLabel={`Peringatan anggaran: ${budgetAlertCount}`}
        >
          <Bell size={16} color={colors.navy} strokeWidth={2.2} />
          {budgetAlertCount > 0 && (
            <View style={st.badge}><Txt variant="monoBold" style={{ fontSize: 10, lineHeight: 13, color: colors.navy }}>{budgetAlertCount}</Txt></View>
          )}
        </Pressable>
        <Pressable style={st.userPill} onPress={() => router.navigate('/more')} accessibilityRole="button" accessibilityLabel="Akun dan menu lainnya">
          <User size={13} color={colors.navy} strokeWidth={2.4} />
          <Txt variant="monoBold" style={{ fontSize: 11, maxWidth: 80 }} numberOfLines={1}>{user?.username}</Txt>
        </Pressable>
      </View>
      <View style={st.monthRow}>
        <Pressable onPress={() => changeGlobalMonth(-1)} style={st.monthBtn} accessibilityLabel="Bulan sebelumnya" hitSlop={8}>
          <ChevronLeft size={16} color={colors.navy} strokeWidth={2.4} />
        </Pressable>
        <Txt variant="monoBold" style={{ fontSize: 12, flex: 1, textAlign: 'center' }}>{getMonthLabel(selectedMonth).toUpperCase()}</Txt>
        <Pressable onPress={() => changeGlobalMonth(1)} style={st.monthBtn} accessibilityLabel="Bulan berikutnya" hitSlop={8}>
          <ChevronRight size={16} color={colors.navy} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

// Header + scrolling content with pull-to-refresh. `back` adds a return bar for pages opened from "Lainnya".
export function Screen({ children, title, back }: { children: ReactNode; title?: string; back?: boolean }) {
  const { reload, refreshing } = useFinance();
  return (
    <View style={st.screen}>
      <AppHeader />
      {back && (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/more'))}
          style={st.backBar}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <ChevronLeft size={16} color={colors.navy} strokeWidth={2.6} />
          <Txt variant="monoBold" style={{ fontSize: 11 }}>KEMBALI</Txt>
        </Pressable>
      )}
      <ScrollView
        contentContainerStyle={st.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.navy} colors={[colors.navy]} />}
      >
        {title ? <Txt variant="display" style={st.title}>{title}</Txt> : null}
        {children}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: colors.panel,
    borderBottomWidth: 2,
    borderBottomColor: colors.navy,
    rowGap: 8,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.butter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconPill: {
    width: 34,
    height: 32,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 3,
    borderRadius: 10,
    backgroundColor: colors.bubblegum,
    borderWidth: 1.5,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.lavender,
  },
  monthRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.navy,
    borderRadius: 6,
    backgroundColor: colors.butter,
  },
  monthBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  backBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.page,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.hairline,
  },
  content: { padding: 14, paddingBottom: 40 },
  title: { fontSize: 22, marginBottom: 12 },
});

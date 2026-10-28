// App header and the scrolling screen wrapper used by every screen
import { router, usePathname } from 'expo-router';
import { Bell, ChevronLeft, ChevronRight, GitBranch, LayoutGrid } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { calculateTotalBalance, getBudgetStatuses } from '@/lib/finance';
import { formatIDR, getMonthLabel } from '@/lib/formatters';
import { colors } from '@/lib/theme';
import { Txt } from './ui';

// Header matching the Soft Neo-Brutalism / Playful Bento greeting + controls
export function AppHeader() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { selectedMonth, changeGlobalMonth, budgetAlertCount, state } = useFinance();
  const { user } = useAuth();

  const rawName = user?.username || 'Galih';
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const initial = displayName.charAt(0).toUpperCase();

  const budgets = getBudgetStatuses(state, selectedMonth);
  const safeCount = budgets.filter(b => b.pct < 80).length;
  const totalBal = calculateTotalBalance(state);
  const isAlur = pathname.includes('transactions') || pathname.includes('analytics');

  return (
    <View style={[st.header, { paddingTop: Math.max(insets.top + 6, 14) }]}>
      {/* Top Row: Brand Logo Left + Bell & Profile Avatar Right */}
      <View style={st.topRow}>
        <Pressable
          style={st.brand}
          onPress={() => router.navigate('/')}
          accessibilityRole="button"
          accessibilityLabel="Beranda FinanKu"
        >
          <View style={st.logoIcon}>
            <Txt variant="display" style={{ fontSize: 15, color: colors.navy }}>F</Txt>
          </View>
          <Txt variant="display" style={{ fontSize: 20, letterSpacing: -0.4 }}>FinanKu</Txt>
        </Pressable>

        <View style={st.headerRight}>
          {/* Month Picker Pill */}
          <View style={st.monthPill}>
            <Pressable onPress={() => changeGlobalMonth(-1)} style={st.monthBtn} accessibilityLabel="Bulan sebelumnya" hitSlop={8}>
              <ChevronLeft size={14} color={colors.navy} strokeWidth={2.5} />
            </Pressable>
            <Txt variant="monoBold" style={{ fontSize: 11, paddingHorizontal: 4 }}>{getMonthLabel(selectedMonth)}</Txt>
            <Pressable onPress={() => changeGlobalMonth(1)} style={st.monthBtn} accessibilityLabel="Bulan berikutnya" hitSlop={8}>
              <ChevronRight size={14} color={colors.navy} strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Notification Bell */}
          <Pressable
            style={st.iconPill}
            onPress={() => router.navigate('/budgets')}
            accessibilityRole="button"
            accessibilityLabel={`Peringatan anggaran: ${budgetAlertCount}`}
          >
            <Bell size={15} color={colors.navy} strokeWidth={2.3} />
            {budgetAlertCount > 0 && (
              <View style={st.badge}>
                <Txt variant="monoBold" style={{ fontSize: 9, lineHeight: 12, color: colors.navy }}>{budgetAlertCount}</Txt>
              </View>
            )}
          </Pressable>

          {/* User Avatar + Admin Pill */}
          <Pressable
            style={st.userPill}
            onPress={() => router.navigate('/more')}
            accessibilityRole="button"
            accessibilityLabel="Akun dan menu lainnya"
          >
            <View style={st.avatarCircle}>
              <Txt variant="display" style={{ fontSize: 11 }}>{initial}</Txt>
            </View>
            <View style={st.adminBadge}>
              <Txt variant="monoBold" style={{ fontSize: 9 }}>Admin</Txt>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Greeting Row + Segmented Katalog / Alur Switch */}
      <View style={st.greetingRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Txt variant="display" style={{ fontSize: 26, letterSpacing: -0.5 }}>Halo,</Txt>
            <View style={st.nameHighlight}>
              <Txt variant="display" style={{ fontSize: 24, letterSpacing: -0.5 }}>{displayName}</Txt>
            </View>
            <Txt variant="display" style={{ fontSize: 26 }}>.</Txt>
          </View>
          <Txt style={{ fontSize: 12, color: colors.muted, marginTop: 3 }} numberOfLines={2}>
            {budgets.length > 0
              ? `${safeCount}/${budgets.length} pos anggaran aman · Saldo ${formatIDR(totalBal)}`
              : `Saldo aktif ${formatIDR(totalBal)} · Periode ${getMonthLabel(selectedMonth)}`}
          </Txt>
        </View>

        {/* Segmented Toggle: Katalog / Alur */}
        <View style={st.togglePill}>
          <Pressable
            onPress={() => router.navigate('/')}
            style={[st.toggleItem, !isAlur && st.toggleItemActive]}
            accessibilityRole="button"
          >
            <LayoutGrid size={12} color={!isAlur ? '#fff' : colors.navy} strokeWidth={2.3} />
            <Txt variant="bodyBold" style={{ fontSize: 11, color: !isAlur ? '#fff' : colors.navy }}>Katalog</Txt>
          </Pressable>
          <Pressable
            onPress={() => router.navigate('/transactions')}
            style={[st.toggleItem, isAlur && st.toggleItemActive]}
            accessibilityRole="button"
          >
            <GitBranch size={12} color={isAlur ? '#fff' : colors.navy} strokeWidth={2.3} />
            <Txt variant="bodyBold" style={{ fontSize: 11, color: isAlur ? '#fff' : colors.navy }}>Alur</Txt>
          </Pressable>
        </View>
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
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: colors.page,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.hairline,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.navy,
    borderRadius: 999,
    backgroundColor: colors.panel,
  },
  monthBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  iconPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: colors.lime,
    borderWidth: 1.5,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.panel,
  },
  avatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.navy,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: colors.lime,
    borderWidth: 1,
    borderColor: colors.navy,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  nameHighlight: {
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.lime,
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.panel,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  toggleItemActive: {
    backgroundColor: colors.navy,
  },
  backBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.page,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.hairline,
  },
  content: { padding: 14, paddingBottom: 40 },
  title: { fontSize: 22, marginBottom: 12 },
});


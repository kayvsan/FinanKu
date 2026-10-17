import { Stack } from 'expo-router';
import { View } from 'react-native';

import { ModalHost } from '@/components/modals';
import { TickerBar } from '@/components/ticker';
import { useAuth } from '@/context/AuthContext';
import { FinanceProvider } from '@/context/FinanceContext';
import { colors } from '@/lib/theme';

export default function AppLayout() {
  const { user } = useAuth();
  return (
    <View style={{ flex: 1, backgroundColor: colors.page }}>
      <TickerBar />
      {/* Remount per account so one user's data never shows in another's session */}
      <FinanceProvider key={user?.id}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="analytics" />
          <Stack.Screen name="wallets" />
          <Stack.Screen name="goals" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="settings" />
        </Stack>
        <ModalHost />
      </FinanceProvider>
    </View>
  );
}

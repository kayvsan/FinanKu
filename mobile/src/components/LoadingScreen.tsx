import { View } from 'react-native';

import { colors } from '@/lib/theme';
import { LoadingWindow, TickerBar } from './ticker';

export default function LoadingScreen({ message = 'Memuat data...', error, onRetry }: {
  message?: string;
  error?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.page }}>
      <TickerBar />
      <LoadingWindow message={message} error={error} onRetry={onRetry} />
    </View>
  );
}

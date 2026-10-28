// Running ticker, request progress bar and the loading window (no context dependencies)
import { Loader } from 'lucide-react-native';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPendingCount, subscribePending } from '@/lib/api';
import { colors } from '@/lib/theme';
import { HardShadow, RetroButton, Txt, WinButtons } from './ui';

const TICKER_TEXT = '✦ FINTRACK OS v1.0 • PENGELUARAN BULAN INI TERKENDALI • SALDO DOMPET AMAN • ANGGARAN AKTIF • TARGET TABUNGAN ON TRACK • SELALU CADANGKAN DATA ANDA • KEUANGAN PRIBADI CERDAS ✦   ';

// Marquee like the web app's .top-ticker-bar; also hosts the request progress bar
export function TickerBar() {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [x] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!width) return;
    x.setValue(0);
    const anim = Animated.loop(
      Animated.timing(x, { toValue: -width, duration: width * 28, easing: Easing.linear, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [width, x]);

  return (
    <View style={[st.ticker, { paddingTop: insets.top }]}>
      {/* Two copies side by side; sliding by one copy's width loops seamlessly. The row is wider than the
          screen on purpose (the ticker clips it), so the text must not shrink or wrap. */}
      <Animated.View style={[st.tickerTrack, { transform: [{ translateX: x }] }]}>
        <Txt variant="monoBold" style={st.tickerText} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
          {TICKER_TEXT}
        </Txt>
        <Txt variant="monoBold" style={st.tickerText}>{TICKER_TEXT}</Txt>
      </Animated.View>
      <NetworkProgress />
    </View>
  );
}

// Thin pink/navy striped bar while any API request is in flight
export function NetworkProgress() {
  const pending = useSyncExternalStore(subscribePending, getPendingCount, getPendingCount);
  const [x] = useState(() => new Animated.Value(0));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!pending || !width) return;
    x.setValue(-width * 0.4);
    const anim = Animated.loop(Animated.timing(x, { toValue: width, duration: 900, easing: Easing.linear, useNativeDriver: true }));
    anim.start();
    return () => anim.stop();
  }, [pending, width, x]);

  return (
    <View
      style={st.progressTrack}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      accessibilityLabel={pending ? 'Memuat data dari server' : undefined}
    >
      {pending > 0 && (
        <Animated.View style={[st.progressBar, { width: width * 0.4, transform: [{ translateX: x }] }]}>
          {Array.from({ length: 12 }, (_, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? colors.navy : colors.bubblegum }} />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

// Session check / first data load / connection errors with a retry button
export function LoadingWindow({ message, error, onRetry }: { message: string; error?: string; onRetry?: () => void }) {
  return (
    <View style={st.loadingWrap}>
      <HardShadow style={{ width: '100%', maxWidth: 380 }} contentStyle={{ overflow: 'hidden' }}>
        <View style={st.loadingHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Loader size={14} color={colors.navy} />
            <Txt variant="monoBold" style={{ fontSize: 11 }}>MEMUAT SISTEM</Txt>
          </View>
          <WinButtons />
        </View>
        <View style={{ padding: 18, gap: 12 }}>
          {error ? (
            <>
              <View style={st.loadingError}>
                <Txt variant="bodySemi" style={{ color: colors.error, fontSize: 12 }}>✕ {error}</Txt>
              </View>
              {onRetry && <RetroButton label="COBA LAGI" onPress={onRetry} />}
            </>
          ) : (
            <Txt variant="monoBold" style={{ textAlign: 'center', fontSize: 12, color: colors.muted }}>{message}</Txt>
          )}
        </View>
      </HardShadow>
    </View>
  );
}

const st = StyleSheet.create({
  ticker: { backgroundColor: colors.mint, borderBottomWidth: 2, borderBottomColor: colors.navy, overflow: 'hidden' },
  tickerTrack: { flexDirection: 'row', alignSelf: 'flex-start', width: 6000 },
  tickerText: { fontSize: 10, paddingVertical: 5, letterSpacing: 0.4, flexShrink: 0 },
  progressTrack: { height: 3, overflow: 'hidden', position: 'absolute', left: 0, right: 0, bottom: 0 },
  progressBar: { height: 3, flexDirection: 'row' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.page },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.sky,
    borderBottomWidth: 2,
    borderBottomColor: colors.navy,
  },
  loadingError: { borderWidth: 1.5, borderColor: colors.error, backgroundColor: colors.errorBg, borderRadius: 6, padding: 10 },
});

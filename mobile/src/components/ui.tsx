// Retro building blocks shared by every screen (ported look of the web app's window-box / btn / chip)
import type { ComponentType, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius, type Pastel } from '@/lib/theme';

export type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

// ─── TEXT ───
type Variant = 'body' | 'bodyMedium' | 'bodySemi' | 'bodyBold' | 'display' | 'mono' | 'monoBold';

export function Txt({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  return <Text {...props} style={[styles.text, { fontFamily: fonts[variant] }, style]} />;
}

// ─── HARD SHADOW ───
// React Native shadows are blurred; the retro look needs a solid navy block offset behind the box.
export function HardShadow({
  children,
  offset = 4,
  style,
  contentStyle,
  borderRadius = radius.card,
}: {
  children: ReactNode;
  offset?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
}) {
  return (
    <View style={[{ marginRight: offset, marginBottom: offset }, style]}>
      <View style={[styles.shadow, { top: offset, left: offset, right: -offset, bottom: -offset, borderRadius }]} />
      <View style={[styles.boxed, { borderRadius }, contentStyle]}>{children}</View>
    </View>
  );
}

// ─── WINDOW BOX (SOMETHING.EXE) ───
export function WinButtons() {
  return (
    <View style={styles.winControls}>
      {['_', '□', '✕'].map((c, i) => (
        <View key={c} style={[styles.winBtn, i === 2 && { backgroundColor: colors.bubblegum }]}>
          <Txt variant="monoBold" style={styles.winBtnText}>{c}</Txt>
        </View>
      ))}
    </View>
  );
}

export function WindowBox({
  title,
  icon: Icon,
  color = 'butter',
  actions,
  children,
  style,
  bodyStyle,
  showControls = true,
}: {
  title: string;
  icon?: IconType;
  color?: Pastel;
  actions?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  showControls?: boolean;
}) {
  return (
    <HardShadow style={[{ marginBottom: 18 }, style]} contentStyle={{ overflow: 'hidden' }}>
      <View style={[styles.winHeader, { backgroundColor: colors[color] }]}>
        <View style={styles.winTitle}>
          {Icon && <Icon size={14} color={colors.navy} strokeWidth={2.2} />}
          <Txt variant="monoBold" style={styles.winTitleText} numberOfLines={1}>{title}</Txt>
        </View>
        <View style={styles.winControls}>
          {actions}
          {showControls && <WinButtons />}
        </View>
      </View>
      <View style={[styles.winBody, bodyStyle]}>{children}</View>
    </HardShadow>
  );
}

// ─── BUTTONS ───
type ButtonVariant = 'primary' | 'secondary' | 'butter' | 'danger' | 'warn' | 'success';

const BUTTON_COLORS: Record<ButtonVariant, { bg: string; fg: string }> = {
  primary: { bg: colors.navy, fg: '#fff' },
  secondary: { bg: '#fff', fg: colors.navy },
  butter: { bg: colors.butter, fg: colors.navy },
  danger: { bg: colors.error, fg: '#fff' },
  warn: { bg: colors.butter, fg: colors.navy },
  success: { bg: colors.success, fg: '#fff' },
};

export function RetroButton({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled,
  loading,
  small,
  style,
  textStyle,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconType;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { bg, fg } = BUTTON_COLORS[variant];
  const inactive = disabled || loading;
  const offset = small ? 2 : 3;
  return (
    <View style={[{ marginRight: offset, marginBottom: offset, opacity: inactive ? 0.6 : 1 }, style]}>
      {!inactive && (
        <View style={[styles.shadow, { top: offset, left: offset, right: -offset, bottom: -offset, borderRadius: radius.btn }]} />
      )}
      <Pressable
        onPress={onPress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!inactive, busy: !!loading }}
        style={({ pressed }) => [
          styles.btn,
          small && styles.btnSmall,
          { backgroundColor: bg },
          pressed && !inactive && { transform: [{ translateX: offset }, { translateY: offset }] },
        ]}
      >
        {loading ? <ActivityIndicator size="small" color={fg} /> : Icon ? <Icon size={small ? 14 : 16} color={fg} strokeWidth={2.2} /> : null}
        <Txt variant="display" style={[styles.btnText, small && { fontSize: 12 }, { color: fg }, textStyle]}>{label}</Txt>
      </Pressable>
    </View>
  );
}

// Small white pill button used in window headers ("LIHAT SEMUA →")
export function BadgeButton({ label, onPress, icon: Icon, color = '#fff', disabled }: {
  label: string;
  onPress?: () => void;
  icon?: IconType;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [styles.badgeBtn, { backgroundColor: pressed ? colors.butter : color, opacity: disabled ? 0.6 : 1 }]}
    >
      {Icon && <Icon size={12} color={colors.navy} strokeWidth={2.4} />}
      <Txt variant="monoBold" style={styles.badgeBtnText}>{label}</Txt>
    </Pressable>
  );
}

// Square icon button (edit / delete in lists)
export function IconButton({ icon: Icon, onPress, label, danger, disabled }: {
  icon: IconType;
  onPress: () => void;
  label: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconBtn,
        { backgroundColor: pressed ? (danger ? colors.bubblegum : colors.butter) : '#fff', opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Icon size={15} color={danger ? colors.error : colors.navy} strokeWidth={2.2} />
    </Pressable>
  );
}

// ─── CHIPS & PILLS ───
export function Chip({ label, color = 'lavender', textColor = colors.navy }: { label: string; color?: Pastel | 'white'; textColor?: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color === 'white' ? '#fff' : colors[color] }]}>
      <Txt variant="monoBold" style={[styles.chipText, { color: textColor }]}>{label}</Txt>
    </View>
  );
}

export function TagPill({ label }: { label: string }) {
  return (
    <View style={styles.tagPill}>
      <Txt variant="monoBold" style={styles.tagPillText}>{label}</Txt>
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Txt style={styles.emptyText}>{text}</Txt>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.hairline, marginVertical: 10 }, style]} />;
}

export const styles = StyleSheet.create({
  text: { color: colors.navy, fontSize: 14 },
  shadow: { position: 'absolute', backgroundColor: colors.navy },
  boxed: { backgroundColor: colors.panel, borderWidth: 2, borderColor: colors.navy },
  winHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.navy,
    gap: 8,
  },
  winTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  winTitleText: { fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', flexShrink: 1 },
  winControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  winBtn: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 3,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winBtnText: { fontSize: 9, lineHeight: 11 },
  winBody: { padding: 14 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: colors.navy,
    borderRadius: radius.btn,
  },
  btnSmall: { paddingVertical: 6, paddingHorizontal: 10 },
  btnText: { fontSize: 13, letterSpacing: 0.2 },
  badgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 4,
    marginRight: 2,
  },
  badgeBtnText: { fontSize: 10 },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 4,
  },
  chipText: { fontSize: 10 },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  tagPillText: { fontSize: 10 },
  empty: {
    padding: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.faint,
    borderRadius: radius.card,
    alignItems: 'center',
  },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});

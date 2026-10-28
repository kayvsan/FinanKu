import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatRupiahString, MONTH_NAMES_ID, todayISO } from '@/lib/formatters';
import { colors, fonts, radius, type Pastel } from '@/lib/theme';
import { Txt } from './ui';

// ─── SHEET (modal window sliding up from the bottom) ───
export function Sheet({
  visible,
  title,
  color = 'butter',
  onClose,
  dismissable = true,
  children,
}: {
  visible: boolean;
  title: string;
  color?: Pastel;
  onClose: () => void;
  dismissable?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismissable ? onClose : () => {}}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismissable ? onClose : undefined} accessibilityLabel="Tutup" />
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={[s.sheetHeader, { backgroundColor: colors[color] }]}>
              <Txt variant="monoBold" style={s.sheetTitle} numberOfLines={1}>{title.replace(/\.EXE|\.OBJ|\.SYS/g, '').replace(/_/g, ' ')}</Txt>
              {dismissable && (
                <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Tutup" hitSlop={10} style={s.closeBtn}>
                  <X size={14} color={colors.navy} strokeWidth={2.6} />
                </Pressable>
              )}
            </View>
            <ScrollView contentContainerStyle={s.sheetBody} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── FIELDS ───
export function Field({ label, children, style }: { label: string; children: ReactNode; style?: object }) {
  return (
    <View style={[{ marginBottom: 12 }, style]}>
      <Txt variant="monoBold" style={s.label}>{label}</Txt>
      {children}
    </View>
  );
}

export function TextField({ style, ...props }: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.faint}
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={[s.input, focused && s.inputFocused, style]}
    />
  );
}

// Keeps the value formatted as "1.234.567" while typing (formatRupiahInput in the original)
export function RupiahField({ value, onChange, prefix = true, ...props }: Omit<TextInputProps, 'value' | 'onChange'> & {
  value: string;
  onChange: (v: string) => void;
  prefix?: boolean;
}) {
  return (
    <View style={s.rupiahWrap}>
      {prefix && <Txt variant="monoBold" style={s.rpPrefix}>Rp</Txt>}
      <TextField
        {...props}
        value={value}
        onChangeText={t => onChange(formatRupiahString(t))}
        keyboardType="number-pad"
        inputMode="numeric"
        style={[prefix && { paddingLeft: 40 }, props.style]}
      />
    </View>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={s.error} accessibilityRole="alert">
      <Txt variant="bodySemi" style={{ color: colors.error, fontSize: 12 }}>✕ {message}</Txt>
    </View>
  );
}

// ─── SEGMENTED TABS (Pill style synced with web) ───
export function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.segmentedWrap}>
      <View style={s.segmentedShadow} />
      <View style={s.segmented}>
        {options.map(o => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[s.segment, active && s.segmentActive]}
            >
              <Txt
                variant={active ? 'bodyBold' : 'bodySemi'}
                style={[s.segmentText, { color: active ? '#fff' : colors.muted }]}
              >
                {o.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── SELECT (opens a list in a sheet) ───
export interface Option {
  value: string;
  label: string;
  hint?: string;
}

export function SelectField({ value, options, onChange, placeholder = 'Pilih...', title = 'PILIH.EXE' }: {
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  placeholder?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={[s.input, s.selectBox]}>
        <Txt variant={selected ? 'bodyMedium' : 'body'} style={[{ flex: 1, fontSize: 14 }, !selected && { color: colors.faint }]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Txt>
        <ChevronDown size={16} color={colors.navy} />
      </Pressable>
      <Sheet visible={open} title={title} color="sky" onClose={() => setOpen(false)}>
        {options.map(o => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => { onChange(o.value); setOpen(false); }}
              accessibilityRole="button"
              style={({ pressed }) => [s.option, (active || pressed) && { backgroundColor: active ? colors.butter : colors.page }]}
            >
              <Txt variant={active ? 'bodyBold' : 'bodyMedium'} style={{ flex: 1 }}>{o.label}</Txt>
              {o.hint ? <Txt variant="mono" style={{ fontSize: 11, color: colors.muted }}>{o.hint}</Txt> : null}
            </Pressable>
          );
        })}
      </Sheet>
    </>
  );
}

// ─── DATE (calendar sheet; same look on iOS, Android and web) ───
const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const pad = (n: number) => String(n).padStart(2, '0');

export function DateField({ value, onChange, optional, placeholder = 'Pilih tanggal' }: {
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const base = value ? new Date(`${value}T00:00:00`) : new Date();
  const [cursor, setCursor] = useState({ y: base.getFullYear(), m: base.getMonth() });

  const openPicker = () => {
    const d = value ? new Date(`${value}T00:00:00`) : new Date();
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
    setOpen(true);
  };
  const move = (delta: number) => setCursor(c => {
    const d = new Date(c.y, c.m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const first = new Date(cursor.y, cursor.m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const pick = (day: number) => {
    onChange(`${cursor.y}-${pad(cursor.m + 1)}-${pad(day)}`);
    setOpen(false);
  };

  return (
    <>
      <Pressable onPress={openPicker} accessibilityRole="button" style={[s.input, s.selectBox]}>
        <CalendarDays size={16} color={colors.navy} />
        <Txt variant={value ? 'bodyMedium' : 'body'} style={[{ flex: 1, fontSize: 14 }, !value && { color: colors.faint }]}>
          {value || placeholder}
        </Txt>
      </Pressable>
      <Sheet visible={open} title="KALENDER.EXE" color="lavender" onClose={() => setOpen(false)}>
        <View style={s.calHeader}>
          <Pressable onPress={() => move(-1)} style={s.calNav} accessibilityLabel="Bulan sebelumnya" hitSlop={8}>
            <ChevronLeft size={18} color={colors.navy} />
          </Pressable>
          <Txt variant="display" style={{ fontSize: 16 }}>{MONTH_NAMES_ID[cursor.m]} {cursor.y}</Txt>
          <Pressable onPress={() => move(1)} style={s.calNav} accessibilityLabel="Bulan berikutnya" hitSlop={8}>
            <ChevronRight size={18} color={colors.navy} />
          </Pressable>
        </View>
        <View style={s.calGrid}>
          {WEEKDAYS.map(w => (
            <View key={w} style={s.calCell}><Txt variant="monoBold" style={{ fontSize: 10, color: colors.muted }}>{w}</Txt></View>
          ))}
          {cells.map((day, i) => {
            const iso = day ? `${cursor.y}-${pad(cursor.m + 1)}-${pad(day)}` : '';
            const active = !!day && iso === value;
            return (
              <View key={i} style={s.calCell}>
                {day ? (
                  <Pressable
                    onPress={() => pick(day)}
                    accessibilityRole="button"
                    accessibilityLabel={iso}
                    style={({ pressed }) => [s.calDay, active && s.calDayActive, pressed && !active && { backgroundColor: colors.page }]}
                  >
                    <Txt variant={active ? 'bodyBold' : 'bodyMedium'} style={{ fontSize: 13 }}>{day}</Txt>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Pressable
            style={[s.calQuick, { flex: 1 }]}
            onPress={() => { onChange(todayISO()); setOpen(false); }}
          >
            <Txt variant="monoBold" style={{ fontSize: 11 }}>HARI INI</Txt>
          </Pressable>
          {optional && (
            <Pressable style={[s.calQuick, { flex: 1 }]} onPress={() => { onChange(''); setOpen(false); }}>
              <Txt variant="monoBold" style={{ fontSize: 11 }}>KOSONGKAN</Txt>
            </Pressable>
          )}
        </View>
      </Sheet>
    </>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,34,27,0.45)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.panel,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.navy,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.navy,
  },
  sheetTitle: { fontSize: 12, letterSpacing: 0.5, flexShrink: 1, textTransform: 'uppercase' },
  closeBtn: {
    width: 28,
    height: 28,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: { padding: 16 },
  label: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5, color: colors.navy },
  input: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.navy,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: radius.input,
    backgroundColor: colors.panel,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    minHeight: 44,
  },
  inputFocused: { borderWidth: 2, backgroundColor: '#fff' },
  rupiahWrap: { position: 'relative', justifyContent: 'center' },
  rpPrefix: { position: 'absolute', left: 14, zIndex: 1, fontSize: 13 },
  error: {
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
    borderRadius: radius.input,
    padding: 10,
    marginBottom: 12,
  },
  segmentedWrap: {
    position: 'relative',
    marginBottom: 16,
    marginRight: 3,
  },
  segmentedShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    borderRadius: 999,
    backgroundColor: colors.navy,
  },
  segmented: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderWidth: 2,
    borderColor: colors.navy,
    borderRadius: 999,
    backgroundColor: colors.page,
  },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 999 },
  segmentActive: { backgroundColor: colors.navy },
  segmentText: { fontSize: 12 },
  selectBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  calNav: { width: 34, height: 34, borderWidth: 1.5, borderColor: colors.navy, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  calDay: { width: '100%', height: '100%', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  calDayActive: { backgroundColor: colors.lime, borderWidth: 2, borderColor: colors.navy },
  calQuick: {
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 999,
    backgroundColor: colors.page,
  },
});

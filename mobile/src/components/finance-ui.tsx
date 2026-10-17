// Finance widgets shared by several screens
import { Pencil, Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { useFinance } from '@/context/FinanceContext';
import { budgetLevel, getCategoryById, getWalletById } from '@/lib/finance';
import { formatIDR } from '@/lib/formatters';
import { colors, fonts, type Pastel } from '@/lib/theme';
import type { Transaction } from '@/lib/types';
import { HardShadow, IconButton, TagPill, Txt, type IconType } from './ui';

// ─── TRANSACTION ROW (renderTxItemHTML) ───
export function TxItem({ tx }: { tx: Transaction }) {
  const { state, openEditTransaction, deleteTransaction, isBusy } = useFinance();
  const wallet = getWalletById(state, tx.walletId);
  let title: string, badge: string, amount: string, color: string;
  if (tx.type === 'transfer') {
    title = `Transfer: ${wallet.name} → ${getWalletById(state, tx.toWalletId).name}`;
    badge = 'Transfer';
    amount = formatIDR(tx.amount);
    color = '#1d5fa8';
  } else {
    title = getCategoryById(state, tx.categoryId).name;
    badge = wallet.name;
    amount = (tx.type === 'income' ? '+' : '-') + formatIDR(tx.amount);
    color = tx.type === 'income' ? colors.success : colors.error;
  }
  const deleting = isBusy(`tx-del-${tx.id}`);

  return (
    <View style={[s.txItem, deleting && s.busy]}>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={s.txTitleRow}>
          <Txt variant="bodyBold" style={{ fontSize: 14 }} numberOfLines={1}>{title}</Txt>
        </View>
        <View style={s.txBadges}>
          <TagPill label={badge} />
          {tx.tag ? <View style={s.tag}><Txt variant="monoBold" style={{ fontSize: 10 }}>{tx.tag}</Txt></View> : null}
        </View>
        <Txt variant="mono" style={s.txMeta} numberOfLines={2}>{tx.date}{tx.note ? ` · ${tx.note}` : ''}</Txt>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Txt variant="display" style={{ fontSize: 14, color }}>{amount}</Txt>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <IconButton icon={Pencil} label="Edit transaksi" onPress={() => openEditTransaction(tx)} disabled={deleting} />
          <IconButton icon={Trash2} label="Hapus transaksi" danger onPress={() => deleteTransaction(tx.id)} disabled={deleting} />
        </View>
      </View>
    </View>
  );
}

// ─── BUDGET BAR ───
const LEVEL_COLOR = { safe: colors.success, warn: '#c28a00', over: colors.error } as const;
const LEVEL_FILL = { safe: colors.mint, warn: colors.butter, over: colors.bubblegum } as const;
export const LEVEL_LABEL = { safe: 'Aman', warn: 'Hampir Habis', over: 'Terlampaui' } as const;

export function ProgressTrack({ pct, level = 'safe', height = 12 }: { pct: number; level?: 'safe' | 'warn' | 'over'; height?: number }) {
  return (
    <View style={[s.track, { height }]}>
      <View style={[s.fill, { width: `${Math.min(Math.max(pct, 0), 100)}%`, backgroundColor: LEVEL_FILL[level] }]} />
    </View>
  );
}

export function BudgetBar({ name, pct, spent, limit }: { name: string; pct: number; spent: number; limit: number }) {
  const level = budgetLevel(pct);
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={s.rowBetween}>
        <Txt variant="bodySemi" style={{ fontSize: 13 }}>{name}</Txt>
        <Txt variant="monoBold" style={{ fontSize: 11, color: LEVEL_COLOR[level] }}>{LEVEL_LABEL[level]} ({pct}%)</Txt>
      </View>
      <ProgressTrack pct={pct} level={level} />
      <View style={[s.rowBetween, { marginTop: 4 }]}>
        <Txt variant="mono" style={s.small}>Terpakai: {formatIDR(spent)}</Txt>
        <Txt variant="mono" style={s.small}>Batas: {formatIDR(limit)}</Txt>
      </View>
    </View>
  );
}

// ─── KPI CARD (.retro-kpi-card) ───
export function KpiCard({ strip, label, badge, icon: Icon, pill, value, valueColor = colors.navy, footer, children }: {
  strip: Pastel;
  label: string;
  badge: string;
  icon: IconType;
  pill: string;
  value: string;
  valueColor?: string;
  footer: string;
  children?: ReactNode;
}) {
  return (
    <HardShadow style={{ marginBottom: 14 }} contentStyle={{ overflow: 'hidden' }}>
      <View style={[s.kpiStrip, { backgroundColor: colors[strip] }]}>
        <Txt variant="monoBold" style={{ fontSize: 10, flex: 1 }} numberOfLines={1}>{label}</Txt>
        <View style={s.stripBadge}><Txt variant="monoBold" style={{ fontSize: 9 }}>{badge}</Txt></View>
        <Icon size={14} color={colors.navy} strokeWidth={2.2} />
      </View>
      <View style={{ padding: 12, gap: 6 }}>
        <TagPill label={pill} />
        <Txt variant="display" style={{ fontSize: 22, color: valueColor }} numberOfLines={1} adjustsFontSizeToFit>{value}</Txt>
        <View style={s.kpiFooter}><Txt variant="monoBold" style={{ fontSize: 10 }}>{footer}</Txt></View>
        {children}
      </View>
    </HardShadow>
  );
}

// ─── CHARTS ───
export const CHART_PALETTE = ['#1b1b3a', '#ff8fcf', '#ffe45e', '#8ed1fc', '#d6c7ff', '#bcead5', '#ffbe98', '#0f7a5a'];

export function DonutChart({ values, size = 190 }: { values: number[]; size?: number }) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const stroke = size * 0.2;
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const lengths = values.map(v => (v / total) * c);
  // where each segment starts along the circumference
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* A circle's stroke starts at 3 o'clock; shifting every segment by a quarter turn starts it at 12 */}
      <G>
        {lengths.map((len, i) => (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={CHART_PALETTE[i % CHART_PALETTE.length]}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={c / 4 - starts[i]}
            />
        ))}
      </G>
      {/* navy outlines like the web chart's borderColor */}
      <Circle cx={size / 2} cy={size / 2} r={r + stroke / 2} fill="none" stroke={colors.navy} strokeWidth={2} />
      <Circle cx={size / 2} cy={size / 2} r={r - stroke / 2} fill="none" stroke={colors.navy} strokeWidth={2} />
    </Svg>
  );
}

export function BarChart({ labels, series, width, height = 220 }: {
  labels: string[];
  series: { label: string; color: string; values: number[] }[];
  width: number;
  height?: number;
}) {
  const padL = 46;
  const padB = 22;
  const padT = 8;
  const chartW = Math.max(width - padL - 6, 10);
  const chartH = height - padB - padT;
  const max = Math.max(1, ...series.flatMap(s => s.values));
  const nice = niceMax(max);
  const groupW = chartW / Math.max(labels.length, 1);
  const barW = Math.min(18, (groupW - 8) / series.length);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <Svg width={width} height={height}>
      {ticks.map(t => {
        const y = padT + chartH - t * chartH;
        return (
          <G key={t}>
            <Line x1={padL} x2={width - 4} y1={y} y2={y} stroke="rgba(27,27,58,0.08)" strokeWidth={1} />
            <SvgText x={padL - 6} y={y + 3} fontSize={9} fontFamily={fonts.mono} fill={colors.navy} textAnchor="end">
              {compact(nice * t)}
            </SvgText>
          </G>
        );
      })}
      {labels.map((label, i) => {
        const gx = padL + i * groupW + (groupW - barW * series.length) / 2;
        return (
          <G key={label + i}>
            {series.map((s, j) => {
              const h = (s.values[i] / nice) * chartH;
              return (
                <Rect
                  key={s.label}
                  x={gx + j * barW}
                  y={padT + chartH - h}
                  width={barW - 2}
                  height={Math.max(h, 0)}
                  fill={s.color}
                  stroke={colors.navy}
                  strokeWidth={1.5}
                  rx={2}
                />
              );
            })}
            <SvgText x={padL + i * groupW + groupW / 2} y={height - 6} fontSize={9} fontFamily={fonts.mono} fill={colors.navy} textAnchor="middle">
              {label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

function niceMax(v: number) {
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function compact(v: number) {
  if (v >= 1e9) return `${+(v / 1e9).toFixed(1)}M`;
  if (v >= 1e6) return `${+(v / 1e6).toFixed(1)}jt`;
  if (v >= 1e3) return `${+(v / 1e3).toFixed(0)}rb`;
  return String(Math.round(v));
}

export const s = StyleSheet.create({
  txItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.hairline,
  },
  busy: { opacity: 0.45 },
  txTitleRow: { flexDirection: 'row', alignItems: 'center' },
  txBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: colors.lavender },
  txMeta: { fontSize: 11, color: colors.muted },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, gap: 8 },
  small: { fontSize: 10, color: colors.muted },
  track: {
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 4,
    backgroundColor: colors.page,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRightWidth: 1.5, borderRightColor: colors.navy },
  kpiStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.navy,
  },
  stripBadge: { paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1.5, borderColor: colors.navy, borderRadius: 3, backgroundColor: '#fff' },
  kpiFooter: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.page,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
});

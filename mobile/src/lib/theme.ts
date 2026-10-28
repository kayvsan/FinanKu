// Design tokens synced with website Soft Neo-Brutalism / Playful Bento Grid
export const colors = {
  navy: '#11221B',
  page: '#F8F7F2',
  panel: '#ffffff',
  lime: '#CCF32F',
  bubblegum: '#FBCFE8',
  butter: '#FEF08A',
  sky: '#BAE6FD',
  lavender: '#D8B4FE',
  mint: '#BBF7D0',
  peach: '#FED7AA',
  success: '#0F7A5A',
  error: '#BA1A1A',
  errorBg: '#fef2f2',
  muted: 'rgba(17,34,27,0.62)',
  faint: 'rgba(17,34,27,0.42)',
  hairline: 'rgba(17,34,27,0.14)',
  grid: 'rgba(17,34,27,0.06)',
} as const;

export type Pastel = 'lime' | 'butter' | 'sky' | 'mint' | 'bubblegum' | 'peach' | 'lavender';

// Families registered by useFonts() in src/app/_layout.tsx
export const fonts = {
  display: 'PlusJakartaSans_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemi: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

export const radius = { card: 16, btn: 999, input: 12 } as const;
export const border = { heavy: 2, light: 1.5 } as const;


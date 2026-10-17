// Design tokens ported from website/src/index.css (:root)
export const colors = {
  navy: '#1b1b3a',
  page: '#f3f5fc',
  panel: '#ffffff',
  bubblegum: '#ff8fcf',
  butter: '#ffe45e',
  sky: '#8ed1fc',
  lavender: '#d6c7ff',
  mint: '#bcead5',
  peach: '#ffbe98',
  success: '#0f7a5a',
  error: '#ba1a1a',
  errorBg: '#fef2f2',
  muted: 'rgba(27,27,58,0.55)',
  faint: 'rgba(27,27,58,0.4)',
  hairline: 'rgba(27,27,58,0.12)',
  grid: 'rgba(27,27,58,0.06)',
} as const;

export type Pastel = 'butter' | 'sky' | 'mint' | 'bubblegum' | 'peach' | 'lavender';

// Families registered by useFonts() in src/app/_layout.tsx
export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemi: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

export const radius = { card: 6, btn: 6 } as const;
export const border = { heavy: 2, light: 1.5 } as const;

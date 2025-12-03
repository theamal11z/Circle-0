export const colors = {
  midnightBlack: '#0E0E11',
  deepIndigo: '#19192A',
  violetGlow: '#7365FF',
  calmBlue: '#4D7CFF',
  warmOrange: '#FFAE66',
  mutedWhite: '#EAEAF2',
  gray: '#606070',
  darkGray: '#2A2A3A',
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const animations = {
  duration: {
    short: 120,
    medium: 300,
    long: 700,
  },
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
};

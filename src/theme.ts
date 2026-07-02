// App design system — colors, spacing, radii, typography, shadow.
import { Platform, ViewStyle } from 'react-native';

export const colors = {
  primary: '#4F46E5', // indigo
  primaryDark: '#4338CA',
  primarySoft: '#EEF2FF',

  bg: '#F6F7FB',
  surface: '#FFFFFF',

  text: '#0F172A',
  textMuted: '#64748B',
  textFaint: '#94A3B8',

  border: '#E7E9F0',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',

  // Refined default category palette (used for seeds + fallback).
  chart: ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#94A3B8'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const font = {
  h1: 30,
  h2: 22,
  h3: 18,
  body: 16,
  sm: 14,
  xs: 12,
};

// Subtle, mature elevation for cards.
export const shadow = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0F172A',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
};

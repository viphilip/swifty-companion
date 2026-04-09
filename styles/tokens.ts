import { Platform } from 'react-native';

export type AppThemeName = 'light' | 'dark';

export const AppColors = {
  light: {
    // Core brand palette from docs/UXUI/DESIGN.MD
    primary: '#7dd3fc',
    secondary: '#88b4cc',
    tertiary: '#c8a0f0',

    // Semantic colors
    background: '#e0eaf2',
    text: '#0f172a',
    textSecondary: '#466176',
    textMuted: '#667f92',
    link: '#4aa6d2',

    // Navigation/UI compatibility with existing theme usage
    tint: '#7dd3fc',
    icon: '#5f7687',
    tabIconDefault: '#748c9d',
    tabIconSelected: '#7dd3fc',

    // Glass surfaces
    surface: 'rgba(255, 255, 255, 0.60)',
    surfaceElevated: 'rgba(255, 255, 255, 0.75)',
    borderGlass: 'rgba(125, 211, 252, 0.12)',
    borderGlassStrong: 'rgba(125, 211, 252, 0.2)',
    glow: 'rgba(125, 211, 252, 0.05)',
    inputPlaceholder: '#6f8698',
  },
  dark: {
    // Keep same brand accents, adapt surfaces for dark mode readability
    primary: '#7dd3fc',
    secondary: '#88b4cc',
    tertiary: '#c8a0f0',

    background: '#0f1722',
    text: '#ebf3f8',
    textSecondary: '#b3c7d6',
    textMuted: '#8ea3b1',
    link: '#9bdfff',

    tint: '#7dd3fc',
    icon: '#9eb4c2',
    tabIconDefault: '#8498a6',
    tabIconSelected: '#7dd3fc',

    surface: 'rgba(28, 41, 55, 0.6)',
    surfaceElevated: 'rgba(35, 52, 69, 0.75)',
    borderGlass: 'rgba(125, 211, 252, 0.2)',
    borderGlassStrong: 'rgba(125, 211, 252, 0.28)',
    glow: 'rgba(125, 211, 252, 0.12)',
    inputPlaceholder: '#8ca2b1',
  },
} as const;

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const Typography = {
  size: {
    body: 16,
    bodySmall: 14,
    subtitle: 20,
    title: 32,
  },
  lineHeight: {
    body: 24,
    bodySmall: 20,
    subtitle: 26,
    title: 38,
  },
  letterSpacing: {
    body: 0,
    title: 0.2,
  },
} as const;

const interWebFallback =
  "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const AppFonts = Platform.select({
  ios: {
    sans: 'Inter',
    serif: 'Inter',
    rounded: 'Inter',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Inter',
    serif: 'Inter',
    rounded: 'Inter',
    mono: 'monospace',
  },
  web: {
    sans: interWebFallback,
    serif: interWebFallback,
    rounded: interWebFallback,
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

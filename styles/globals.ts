import { StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';

import type { AppThemeName } from './tokens';
import { Radius, Spacing } from './tokens';

export function createGlobalStyles(theme: AppThemeName) {
  const palette = Colors[theme];

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      gap: Spacing.md,
    },
    section: {
      gap: Spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    glassCard: {
      backgroundColor: palette.surface,
      borderColor: palette.borderGlass,
      borderWidth: 1,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
    },
    glassCardElevated: {
      backgroundColor: palette.surfaceElevated,
      borderColor: palette.borderGlassStrong,
      borderWidth: 1,
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      shadowColor: palette.primary,
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 0,
    },
    glassInput: {
      minHeight: 48,
      backgroundColor: palette.surface,
      borderColor: palette.borderGlass,
      borderWidth: 1,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      letterSpacing: -0.8,
      color: palette.text,
    },
    glassInputFocused: {
      borderColor: palette.borderGlassStrong,
      shadowColor: palette.primary,
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 0,
    },
    glassButtonPrimary: {
      minHeight: 48,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.borderGlassStrong,
      borderWidth: 1,
      shadowColor: palette.primary,
      shadowOpacity: 0.14,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 0,
    },
    glassButtonPrimaryPressed: {
      backgroundColor: palette.surfaceElevated,
      opacity: 0.92,
    },
    subtleBorder: {
      borderColor: palette.borderGlass,
      borderWidth: 1,
      borderRadius: Radius.md,
    },
  });
}

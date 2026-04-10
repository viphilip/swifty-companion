import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type FortyTwoUser } from '@/services/oauth';
import { Radius, Spacing, useGlobalStyles } from '@/styles';

interface ProfileHeaderSectionProps {
  user: FortyTwoUser;
  mainCursusLevel?: number | null;
}

export function ProfileHeaderSection({ user, mainCursusLevel }: ProfileHeaderSectionProps) {
  const theme = useColorScheme() ?? 'light';
  const palette = Colors[theme];
  const g = useGlobalStyles();
  const avatarUrl = user.image?.versions?.large ?? user.image?.link ?? null;

  return (
    <View style={[g.glassCardElevated, styles.headerCard]}>
      <View style={styles.identityRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} contentFit="cover" style={styles.avatar} transition={140} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <ThemedText type="subtitle">{user.login.slice(0, 1).toUpperCase()}</ThemedText>
          </View>
        )}

        <View style={styles.identityTextBlock}>
          <ThemedText type="title" style={styles.loginTitle}>
            {user.login}
          </ThemedText>
          <ThemedText style={{ color: palette.textSecondary }}>{user.email}</ThemedText>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={[styles.metaChip, g.subtleBorder]}>
          <ThemedText style={styles.metaLabel}>Wallet</ThemedText>
          <ThemedText type="defaultSemiBold">{user.wallet} ₳</ThemedText>
        </View>
        <View style={[styles.metaChip, g.subtleBorder]}>
          <ThemedText style={styles.metaLabel}>Level</ThemedText>
          <ThemedText type="defaultSemiBold">
            {typeof mainCursusLevel === 'number' ? mainCursusLevel.toFixed(2) : 'N/A'}
          </ThemedText>
        </View>
        <View style={[styles.metaChip, g.subtleBorder]}>
          <ThemedText style={styles.metaLabel}>Location</ThemedText>
          <ThemedText type="defaultSemiBold">{user.location ?? 'Unavailable'}</ThemedText>
        </View>
        <View style={[styles.metaChip, g.subtleBorder]}>
          <ThemedText style={styles.metaLabel}>EPs</ThemedText>
          <ThemedText type="defaultSemiBold">{user.correction_point}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    gap: Spacing.md,
  },
  identityRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  identityTextBlock: {
    flex: 1,
    gap: 4,
  },
  loginTitle: {
    fontSize: 30,
    lineHeight: 34,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.22)',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metaChip: {
    minWidth: '47%',
    flex: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  metaLabel: {
    opacity: 0.72,
  },
});

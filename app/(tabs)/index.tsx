import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FortyTwoApiError, type FortyTwoUser, getUserByLogin } from '@/services/oauth';
import { Radius, Spacing, useGlobalStyles } from '@/styles';

function mapErrorToMessage(error: unknown) {
  if (error instanceof FortyTwoApiError) {
    if (error.code === 'USER_NOT_FOUND') return 'Login introuvable';
    if (error.code === 'NETWORK_ERROR') return 'Erreur reseau, verifie ta connexion';
    if (error.code === 'CONFIG_ERROR') return 'Configuration API manquante dans .env.local';
    if (error.code === 'AUTH_ERROR') return "Impossible d'obtenir le token OAuth";
    return 'Erreur API, reessaie dans un instant';
  }
  return 'Une erreur inattendue est survenue';
}

function getDisplayedLevel(user: FortyTwoUser) {
  const mainCursus =
    user.cursus_users.find((cursus) => cursus.cursus_id === 21) ?? user.cursus_users[0];

  return typeof mainCursus?.level === 'number' ? mainCursus.level.toFixed(2) : 'N/A';
}

export default function SearchScreen() {
  const [login, setLogin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUser, setPreviewUser] = useState<FortyTwoUser | null>(null);

  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const palette = Colors[theme];
  const g = useGlobalStyles();
  const canSearch = login.trim().length > 0 && !isLoading;

  async function handleSearch() {
    if (!canSearch) return;

    Keyboard.dismiss();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await getUserByLogin(login);
      setPreviewUser(result);
    } catch (error) {
      setPreviewUser(null);
      setErrorMessage(mapErrorToMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={g.screen} edges={['top']}>
      <View style={styles.headerBlock}>
        <ThemedText type="title" style={styles.appTitle}>
          Swifty Companion
        </ThemedText>
        <ThemedText style={{ color: palette.textSecondary }}>
          Recherche un etudiant 42 par son login
        </ThemedText>
      </View>

      <View style={[g.glassCardElevated, styles.searchCard]}>
        <View style={styles.searchRow}>
          <TextInput
            value={login}
            onChangeText={setLogin}
            placeholder="ex: ton login 42"
            placeholderTextColor={palette.inputPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            style={[
              g.glassInput,
              styles.input,
              isInputFocused ? g.glassInputFocused : undefined,
            ]}
          />
          <Pressable
            onPress={handleSearch}
            disabled={!canSearch}
            style={({ pressed }) => [
              g.glassButtonPrimary,
              styles.searchButton,
              pressed && canSearch ? g.glassButtonPrimaryPressed : undefined,
              !canSearch ? styles.searchButtonDisabled : undefined,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={palette.primary} />
            ) : (
              <IconSymbol
                name="magnifyingglass"
                size={18}
                color={palette.text}
              />
            )}
          </Pressable>
        </View>
      </View>

      {errorMessage ? (
        <View style={[g.glassCard, styles.errorCard]}>
          <ThemedText style={{ color: '#dc2626' }}>{errorMessage}</ThemedText>
        </View>
      ) : null}

      {previewUser ? (
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/profile',
              params: { login: previewUser.login },
            });
          }}
          style={({ pressed }) => [
            g.glassCard,
            styles.previewCard,
            {
              borderWidth: 1,
              borderColor: palette.borderGlassStrong,
              shadowColor: palette.primary,
              shadowOpacity: 0.18,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 0,
            },
            pressed ? styles.previewCardPressed : undefined,
          ]}>
          <View style={styles.previewHeader}>
            <View style={styles.previewTitleRow}>
              <ThemedText type="subtitle">Preview</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={palette.primary} />
          </View>

          <View style={[styles.previewRow, styles.previewRowWithBorder]}>
            <View style={styles.previewLabelBlock}>
              <IconSymbol name="person.fill" size={15} color={palette.icon} />
              <ThemedText style={styles.previewLabel}>login</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold">{previewUser.login}</ThemedText>
          </View>
          <View style={[styles.previewRow, styles.previewRowWithBorder]}>
            <View style={styles.previewLabelBlock}>
              <IconSymbol name="envelope.fill" size={15} color={palette.icon} />
              <ThemedText style={styles.previewLabel}>email</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold">{previewUser.email || 'N/A'}</ThemedText>
          </View>
          <View style={[styles.previewRow, styles.previewRowWithBorder]}>
            <View style={styles.previewLabelBlock}>
              <ThemedText style={[styles.moneySymbol, { color: palette.icon }]}>₳</ThemedText>
              <ThemedText style={styles.previewLabel}>wallet</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold">{previewUser.wallet}</ThemedText>
          </View>
          <View style={[styles.previewRow, styles.previewRowWithBorder]}>
            <View style={styles.previewLabelBlock}>
              <IconSymbol name="chart.bar.fill" size={15} color={palette.icon} />
              <ThemedText style={styles.previewLabel}>level</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold">{getDisplayedLevel(previewUser)}</ThemedText>
          </View>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: Spacing.xs,
  },
  appTitle: {
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  searchCard: {
    gap: Spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: Radius.lg,
  },
  searchButton: {
    minWidth: 52,
    width: 52,
    borderRadius: Radius.lg,
    paddingHorizontal: 0,
  },
  searchButtonDisabled: {
    opacity: 0.45,
  },
  infoCard: {
    borderRadius: Radius.lg,
  },
  errorCard: {
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  previewCard: {
    gap: Spacing.sm,
    borderRadius: Radius.xl,
  },
  previewCardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  previewTitleRow: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  tapHintBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  tapHintText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    minHeight: 34,
  },
  previewRowWithBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(125, 211, 252, 0.12)',
    paddingTop: Spacing.xs,
  },
  previewLabel: {
    opacity: 0.72,
  },
  moneySymbol: {
    fontWeight: '700',
    lineHeight: 16,
  },
  previewLabelBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

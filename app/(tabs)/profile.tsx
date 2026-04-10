import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileHeaderSection } from '@/components/profile/profile-header-section';
import { ProfileProjectsSection } from '@/components/profile/profile-projects-section';
import { ProfileSkillsSection } from '@/components/profile/profile-skills-section';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  FortyTwoApiError,
  getUserByLogin,
  type FortyTwoCursusUser,
  type FortyTwoSkill,
  type FortyTwoUser,
} from '@/services/oauth';
import { Spacing, useGlobalStyles } from '@/styles';

interface CursusSummary {
  id: number;
  name: string;
  kind: string | null;
  level: number;
  skills: FortyTwoSkill[];
  endAt: string | null;
}

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

function normalizeLoginParam(rawLogin: string | string[] | undefined) {
  if (!rawLogin) return '';
  if (Array.isArray(rawLogin)) return rawLogin[0] ?? '';
  return rawLogin;
}

function buildCursusMap(cursusUsers: FortyTwoCursusUser[]) {
  const cursusMap = new Map<number, CursusSummary>();

  for (const cursusUser of cursusUsers) {
    const current: CursusSummary = {
      id: cursusUser.cursus_id,
      name: cursusUser.cursus?.name ?? `Cursus ${cursusUser.cursus_id}`,
      kind: cursusUser.cursus?.kind ?? null,
      level: cursusUser.level ?? 0,
      skills: cursusUser.skills ?? [],
      endAt: cursusUser.end_at ?? null,
    };

    const existing = cursusMap.get(current.id);
    if (!existing) {
      cursusMap.set(current.id, current);
      continue;
    }

    if (current.skills.length > existing.skills.length || current.level > existing.level) {
      cursusMap.set(current.id, current);
    }
  }

  return cursusMap;
}

function selectMainCursus(cursusMap: Map<number, CursusSummary>) {
  const entries = Array.from(cursusMap.values());
  if (entries.length === 0) return null;

  return (
    entries.find((entry) => entry.id === 21) ??
    entries.find((entry) => entry.endAt === null) ??
    [...entries].sort((a, b) => b.level - a.level)[0]
  );
}

export default function ProfileScreen() {
  const { login: loginParam } = useLocalSearchParams<{ login?: string | string[] }>();
  const login = normalizeLoginParam(loginParam);

  const [user, setUser] = useState<FortyTwoUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const theme = useColorScheme() ?? 'light';
  const palette = Colors[theme];
  const g = useGlobalStyles();

  useEffect(() => {
    let isMounted = true;

    async function loadUserProfile() {
      if (!login) {
        if (isMounted) {
          setUser(null);
          setErrorMessage(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getUserByLogin(login);
        if (isMounted) setUser(response);
      } catch (error) {
        if (isMounted) {
          setUser(null);
          setErrorMessage(mapErrorToMessage(error));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadUserProfile();
    return () => {
      isMounted = false;
    };
  }, [login]);

  const cursusMap = useMemo(() => buildCursusMap(user?.cursus_users ?? []), [user]);
  const mainCursus = useMemo(() => selectMainCursus(cursusMap), [cursusMap]);

  if (!login) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top']}>
        <View style={styles.contentContainer}>
          <View style={[g.glassCard, styles.emptyStateCard]}>
            <ThemedText type="subtitle">Aucun profil selectionne</ThemedText>
            <ThemedText style={{ color: palette.textSecondary }}>
              Fais une recherche dans l&apos;onglet Search puis clique sur la preview
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top']}>
        <View style={[styles.contentContainer, styles.centerState]}>
          <ActivityIndicator size="large" color={palette.primary} />
          <ThemedText style={{ color: palette.textSecondary }}>Chargement du profil...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || errorMessage) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top']}>
        <View style={styles.contentContainer}>
          <View style={[g.glassCard, styles.emptyStateCard]}>
            <ThemedText type="subtitle">Impossible de charger ce profil</ThemedText>
            <ThemedText style={{ color: palette.textSecondary }}>
              {errorMessage ?? 'Une erreur inattendue est survenue'}
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <ProfileHeaderSection user={user} mainCursusLevel={mainCursus?.level} />
        <ProfileSkillsSection skills={mainCursus?.skills ?? []} />
        <ProfileProjectsSection
          projects={user.projects_users ?? []}
          cursusUsers={user.cursus_users ?? []}
          mainCursusId={mainCursus?.id ?? null}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  centerState: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.xs,
  },
  emptyStateCard: {
    gap: Spacing.sm,
  },
});

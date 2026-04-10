import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RadarChart, type RadarDataPoint } from '@/components/charts/radar-chart';
import { ProfileHeaderSection } from '@/components/profile/profile-header-section';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  FortyTwoApiError,
  getUserByLogin,
  type FortyTwoCursusUser,
  type FortyTwoProjectUser,
  type FortyTwoSkill,
  type FortyTwoUser,
} from '@/services/oauth';
import { Radius, Spacing, useGlobalStyles } from '@/styles';

interface CursusSummary {
  id: number;
  name: string;
  kind: string | null;
  level: number;
  skills: FortyTwoSkill[];
  endAt: string | null;
}

interface ProjectItem {
  id: number;
  name: string;
  status: string;
  validated: boolean | null;
  finalMark: number | null;
  updatedAt: string | null;
}

interface ProjectGroup {
  cursusId: number;
  cursusName: string;
  cursusKind: string | null;
  stats: {
    total: number;
    finished: number;
    inProgress: number;
    failed: number;
  };
  projects: ProjectItem[];
}

const SKILL_LEVEL_REFERENCE_MAX = 21;

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

function getValidatedFlag(project: FortyTwoProjectUser) {
  const rawValidated = project['validated?'];
  if (typeof rawValidated === 'boolean' || rawValidated === null) return rawValidated;

  const fallbackValidated = project.validated;
  if (typeof fallbackValidated === 'boolean' || fallbackValidated === null) return fallbackValidated;

  return null;
}

function buildRadarData(skills: FortyTwoSkill[]): RadarDataPoint[] {
  const sortedSkills = [...skills].sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));

  return sortedSkills.map((skill) => ({
    label: skill.name,
    value: skill.level,
    percent: Math.min(100, Math.max(0, (skill.level / SKILL_LEVEL_REFERENCE_MAX) * 100)),
  }));
}

function buildProjectGroups(
  user: FortyTwoUser,
  cursusMap: Map<number, CursusSummary>,
  mainCursusId: number | null
) {
  const groups = new Map<number, ProjectGroup>();

  for (const project of user.projects_users ?? []) {
    const validated = getValidatedFlag(project);
    const ids = project.cursus_ids.length > 0 ? project.cursus_ids : [-1];

    for (const cursusId of ids) {
      if (!groups.has(cursusId)) {
        const cursus = cursusMap.get(cursusId);
        groups.set(cursusId, {
          cursusId,
          cursusName: cursus?.name ?? (cursusId === -1 ? 'Unknown cursus' : `Cursus ${cursusId}`),
          cursusKind: cursus?.kind ?? null,
          stats: {
            total: 0,
            finished: 0,
            inProgress: 0,
            failed: 0,
          },
          projects: [],
        });
      }

      const group = groups.get(cursusId)!;
      group.stats.total += 1;
      if (project.status === 'finished') group.stats.finished += 1;
      if (project.status === 'in_progress') group.stats.inProgress += 1;
      if (project.status === 'finished' && validated === false) group.stats.failed += 1;

      group.projects.push({
        id: project.id,
        name: project.project?.name ?? 'Untitled project',
        status: project.status ?? 'unknown',
        validated,
        finalMark: project.final_mark,
        updatedAt: project.updated_at ?? null,
      });
    }
  }

  const statusRank = (status: string) => {
    if (status === 'in_progress') return 0;
    if (status === 'finished') return 1;
    return 2;
  };

  for (const group of groups.values()) {
    group.projects.sort((a, b) => {
      const byStatus = statusRank(a.status) - statusRank(b.status);
      if (byStatus !== 0) return byStatus;

      const aUpdated = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bUpdated = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      return bUpdated - aUpdated;
    });
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (mainCursusId !== null) {
      if (a.cursusId === mainCursusId) return -1;
      if (b.cursusId === mainCursusId) return 1;
    }
    return a.cursusName.localeCompare(b.cursusName);
  });
}

function getProjectStatusLabel(status: string, validated: boolean | null) {
  if (status === 'in_progress') return 'in progress';
  if (status === 'finished' && validated === false) return 'failed';
  if (status === 'finished' && validated === true) return 'validated';
  if (status === 'finished') return 'finished';
  return status.replace('_', ' ');
}

export default function ProfileScreen() {
  const { login: loginParam } = useLocalSearchParams<{ login?: string | string[] }>();
  const login = normalizeLoginParam(loginParam);

  const [user, setUser] = useState<FortyTwoUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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
  const radarData = useMemo(() => buildRadarData(mainCursus?.skills ?? []), [mainCursus]);
  const projectGroups = useMemo(
    () => (user ? buildProjectGroups(user, cursusMap, mainCursus?.id ?? null) : []),
    [user, cursusMap, mainCursus]
  );

  useEffect(() => {
    if (projectGroups.length === 0) return;

    setOpenGroups((currentState) => {
      const nextState: Record<string, boolean> = {};
      for (const group of projectGroups) {
        const key = String(group.cursusId);
        nextState[key] =
          typeof currentState[key] === 'boolean' ? currentState[key] : group.cursusId === mainCursus?.id;
      }
      return nextState;
    });
  }, [projectGroups, mainCursus?.id]);

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

        <View style={[g.glassCard, styles.sectionCard]}>
          <ThemedText type="subtitle">Skills</ThemedText>
          <ThemedText style={{ color: palette.textSecondary }}>
            {mainCursus
              ? `${mainCursus.name} - ${radarData.length} skills - max ref lv ${SKILL_LEVEL_REFERENCE_MAX}`
              : 'No skills found'}
          </ThemedText>

          {radarData.length >= 3 ? (
            <View style={styles.chartContainer}>
              <RadarChart data={radarData} />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <ThemedText style={{ color: palette.textSecondary }}>
                Not enough skills to display a radar
              </ThemedText>
            </View>
          )}

          <View style={styles.skillsList}>
            {radarData.map((skill) => (
              <View key={skill.label} style={styles.skillRow}>
                <ThemedText style={styles.skillName}>{skill.label}</ThemedText>
                <ThemedText type="defaultSemiBold">
                  Lv {skill.value.toFixed(2)} - {skill.percent.toFixed(0)}%
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.projectsSection}>
          <ThemedText type="subtitle">Projects by cursus</ThemedText>

          {projectGroups.map((group) => {
            const groupKey = String(group.cursusId);
            const isOpen = openGroups[groupKey] ?? false;

            return (
              <View key={groupKey} style={[g.glassCard, styles.projectGroupCard]}>
                <Pressable
                  style={styles.projectGroupHeader}
                  onPress={() => {
                    setOpenGroups((state) => ({ ...state, [groupKey]: !isOpen }));
                  }}>
                  <View style={styles.projectGroupHeaderLeft}>
                    <IconSymbol
                      name="chevron.right"
                      size={18}
                      color={palette.icon}
                      style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
                    />
                    <View>
                      <ThemedText type="defaultSemiBold">{group.cursusName}</ThemedText>
                      <ThemedText style={{ color: palette.textSecondary }}>
                        id {group.cursusId} - {group.cursusKind ?? 'unknown'}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.counterBadge, { borderColor: palette.borderGlassStrong }]}>
                    <ThemedText type="defaultSemiBold">{group.stats.total}</ThemedText>
                  </View>
                </Pressable>

                <View style={styles.statsRow}>
                  <View style={[styles.smallBadge, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                    <ThemedText style={styles.smallBadgeText}>in progress {group.stats.inProgress}</ThemedText>
                  </View>
                  <View style={[styles.smallBadge, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
                    <ThemedText style={styles.smallBadgeText}>finished {group.stats.finished}</ThemedText>
                  </View>
                  <View style={[styles.smallBadge, { backgroundColor: 'rgba(220, 38, 38, 0.1)' }]}>
                    <ThemedText style={styles.smallBadgeText}>failed {group.stats.failed}</ThemedText>
                  </View>
                </View>

                {isOpen ? (
                  <View style={styles.projectRows}>
                    {group.projects.map((project) => {
                      const isFailed = project.status === 'finished' && project.validated === false;
                      const isValidated = project.status === 'finished' && project.validated === true;
                      const tone = isFailed
                        ? { backgroundColor: 'rgba(220, 38, 38, 0.12)', textColor: '#b91c1c' }
                        : isValidated
                          ? { backgroundColor: 'rgba(22, 163, 74, 0.14)', textColor: '#166534' }
                          : project.status === 'in_progress'
                            ? { backgroundColor: 'rgba(37, 99, 235, 0.12)', textColor: '#1d4ed8' }
                            : { backgroundColor: 'rgba(148, 163, 184, 0.14)', textColor: '#475569' };

                      return (
                        <View key={project.id} style={styles.projectRow}>
                          <View style={styles.projectNameBlock}>
                            <ThemedText type="defaultSemiBold">{project.name}</ThemedText>
                            <View style={[styles.statusPill, { backgroundColor: tone.backgroundColor }]}>
                              <ThemedText style={[styles.statusText, { color: tone.textColor }]}>
                                {getProjectStatusLabel(project.status, project.validated)}
                              </ThemedText>
                            </View>
                          </View>
                          <ThemedText type="defaultSemiBold">
                            {project.finalMark === null ? '-' : project.finalMark}
                          </ThemedText>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
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
  sectionCard: {
    gap: Spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
  },
  emptyCard: {
    paddingVertical: Spacing.md,
  },
  skillsList: {
    gap: 8,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  skillName: {
    flex: 1,
    opacity: 0.9,
  },
  projectsSection: {
    gap: Spacing.sm,
  },
  projectGroupCard: {
    gap: Spacing.sm,
  },
  projectGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  projectGroupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  counterBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  smallBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  smallBadgeText: {
    fontSize: 13,
    lineHeight: 16,
  },
  projectRows: {
    gap: Spacing.xs,
  },
  projectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(125, 211, 252, 0.12)',
    paddingTop: Spacing.xs,
  },
  projectNameBlock: {
    flex: 1,
    gap: 6,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
  },
});

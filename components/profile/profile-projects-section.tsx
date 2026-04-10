import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type FortyTwoCursusUser, type FortyTwoProjectUser } from '@/services/oauth';
import { Radius, Spacing, useGlobalStyles } from '@/styles';

interface CursusMeta {
  id: number;
  name: string;
  kind: string | null;
  level: number;
  skillsCount: number;
}

interface ProjectItem {
  id: number;
  name: string;
  status: string;
  resolvedStatus: string;
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

interface ProfileProjectsSectionProps {
  projects: FortyTwoProjectUser[];
  cursusUsers: FortyTwoCursusUser[];
  mainCursusId?: number | null;
}

function buildCursusMetaMap(cursusUsers: FortyTwoCursusUser[]) {
  const cursusMap = new Map<number, CursusMeta>();

  for (const cursusUser of cursusUsers) {
    const current: CursusMeta = {
      id: cursusUser.cursus_id,
      name: cursusUser.cursus?.name ?? `Cursus ${cursusUser.cursus_id}`,
      kind: cursusUser.cursus?.kind ?? null,
      level: cursusUser.level ?? 0,
      skillsCount: cursusUser.skills?.length ?? 0,
    };

    const existing = cursusMap.get(current.id);
    if (!existing) {
      cursusMap.set(current.id, current);
      continue;
    }

    if (current.skillsCount > existing.skillsCount || current.level > existing.level) {
      cursusMap.set(current.id, current);
    }
  }

  return cursusMap;
}

function getValidatedFlag(project: FortyTwoProjectUser) {
  const rawValidated = project['validated?'];
  if (typeof rawValidated === 'boolean' || rawValidated === null) return rawValidated;

  const fallbackValidated = project.validated;
  if (typeof fallbackValidated === 'boolean' || fallbackValidated === null) return fallbackValidated;

  return null;
}

function resolveProjectStatus(status: string, validated: boolean | null) {
  if (validated === true) return 'validated';
  if (validated === false) return 'failed';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'finished') return 'finished';
  return status;
}

function getProjectStatusLabel(resolvedStatus: string) {
  if (resolvedStatus === 'in_progress') return 'in progress';
  return resolvedStatus.replace('_', ' ');
}

function buildProjectGroups(
  projects: FortyTwoProjectUser[],
  cursusMap: Map<number, CursusMeta>,
  mainCursusId: number | null,
) {
  const groups = new Map<number, ProjectGroup>();

  for (const project of projects) {
    const validated = getValidatedFlag(project);
    const status = project.status ?? 'unknown';
    const resolvedStatus = resolveProjectStatus(status, validated);
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
      if (resolvedStatus === 'in_progress') group.stats.inProgress += 1;
      if (resolvedStatus === 'failed') group.stats.failed += 1;
      if (resolvedStatus === 'finished' || resolvedStatus === 'validated') group.stats.finished += 1;

      group.projects.push({
        id: project.id,
        name: project.project?.name ?? 'Untitled project',
        status,
        resolvedStatus,
        validated,
        finalMark: project.final_mark,
        updatedAt: project.updated_at ?? null,
      });
    }
  }

  const statusRank = (resolvedStatus: string) => {
    if (resolvedStatus === 'in_progress') return 0;
    if (resolvedStatus === 'failed') return 1;
    if (resolvedStatus === 'validated' || resolvedStatus === 'finished') return 2;
    return 3;
  };

  for (const group of groups.values()) {
    group.projects.sort((a, b) => {
      const byStatus = statusRank(a.resolvedStatus) - statusRank(b.resolvedStatus);
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

export function ProfileProjectsSection({
  projects,
  cursusUsers,
  mainCursusId = null,
}: ProfileProjectsSectionProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const theme = useColorScheme() ?? 'light';
  const palette = Colors[theme];
  const g = useGlobalStyles();

  const cursusMap = useMemo(() => buildCursusMetaMap(cursusUsers), [cursusUsers]);
  const projectGroups = useMemo(
    () => buildProjectGroups(projects, cursusMap, mainCursusId),
    [projects, cursusMap, mainCursusId],
  );

  useEffect(() => {
    if (projectGroups.length === 0) {
      setOpenGroups({});
      return;
    }

    setOpenGroups((currentState) => {
      const nextState: Record<string, boolean> = {};
      for (const group of projectGroups) {
        const key = String(group.cursusId);
        nextState[key] = typeof currentState[key] === 'boolean' ? currentState[key] : group.cursusId === mainCursusId;
      }
      return nextState;
    });
  }, [projectGroups, mainCursusId]);

  return (
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
                  const tone = project.resolvedStatus === 'failed'
                    ? { backgroundColor: 'rgba(220, 38, 38, 0.12)', textColor: '#b91c1c' }
                    : project.resolvedStatus === 'validated'
                      ? { backgroundColor: 'rgba(22, 163, 74, 0.14)', textColor: '#166534' }
                      : project.resolvedStatus === 'in_progress'
                        ? { backgroundColor: 'rgba(37, 99, 235, 0.12)', textColor: '#1d4ed8' }
                        : { backgroundColor: 'rgba(148, 163, 184, 0.14)', textColor: '#475569' };

                  return (
                    <View key={project.id} style={styles.projectRow}>
                      <View style={styles.projectNameBlock}>
                        <ThemedText type="defaultSemiBold">{project.name}</ThemedText>
                        <View style={[styles.statusPill, { backgroundColor: tone.backgroundColor }]}>
                          <ThemedText style={[styles.statusText, { color: tone.textColor }]}>
                            {getProjectStatusLabel(project.resolvedStatus)}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText type="defaultSemiBold">{project.finalMark === null ? '-' : project.finalMark}</ThemedText>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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

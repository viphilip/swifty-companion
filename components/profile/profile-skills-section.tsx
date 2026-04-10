import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type FortyTwoSkill } from '@/services/oauth';
import { Radius, Spacing, useGlobalStyles } from '@/styles';

const SKILL_LEVEL_REFERENCE_MAX = 21;

interface ProfileSkillsSectionProps {
  skills: FortyTwoSkill[];
}

interface SkillData {
  label: string;
  value: number;
  percent: number;
}

function buildSkillsData(skills: FortyTwoSkill[]): SkillData[] {
  const sortedSkills = [...skills].sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));

  return sortedSkills.map((skill) => ({
    label: skill.name,
    value: skill.level,
    percent: Math.min(100, Math.max(0, (skill.level / SKILL_LEVEL_REFERENCE_MAX) * 100)),
  }));
}

export function ProfileSkillsSection({ skills }: ProfileSkillsSectionProps) {
  const theme = useColorScheme() ?? 'light';
  const palette = Colors[theme];
  const g = useGlobalStyles();
  const [isExpanded, setIsExpanded] = useState(false);
  const skillsData = useMemo(() => buildSkillsData(skills), [skills]);

  if (skillsData.length === 0) {
    return (
      <View style={[g.glassCard, styles.sectionCard]}>
        <ThemedText type="subtitle">Skills</ThemedText>
        <View style={styles.emptyCard}>
          <ThemedText style={{ color: palette.textSecondary }}>No skills found</ThemedText>
        </View>
      </View>
    );
  }

  const INITIAL_VISIBLE_COUNT = 4;
  const hasMoreSkills = skillsData.length > INITIAL_VISIBLE_COUNT;
  const visibleSkills = isExpanded ? skillsData : skillsData.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <View style={[g.glassCard, styles.sectionCard]}>
      <ThemedText type="subtitle">Skills</ThemedText>

      <View style={styles.skillsList}>
        {visibleSkills.map((skill) => (
          <View key={skill.label} style={styles.skillItem}>
            <View style={styles.skillHeader}>
              <ThemedText style={styles.skillName} numberOfLines={1}>
                {skill.label}
              </ThemedText>
              <ThemedText type="defaultSemiBold">
                Lv {skill.value.toFixed(2)} - {skill.percent.toFixed(0)}%
              </ThemedText>
            </View>

            <View style={[styles.progressBarTrack, { backgroundColor: palette.borderGlassStrong }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${skill.percent}%`, backgroundColor: palette.primary },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {hasMoreSkills && (
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          style={({ pressed }) => [styles.expandButton, pressed && { opacity: 0.7 }]}
        >
          <ThemedText type="defaultSemiBold" style={{ color: palette.primary }}>
            {isExpanded ? 'Voir moins' : `Voir les ${skillsData.length - INITIAL_VISIBLE_COUNT} autres skills`}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    gap: Spacing.md,
  },
  emptyCard: {
    paddingVertical: Spacing.md,
  },
  skillsList: {
    gap: Spacing.md,
  },
  skillItem: {
    gap: 6,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  skillName: {
    flex: 1,
    opacity: 0.9,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
});

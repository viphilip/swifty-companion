import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { RadarChart, type RadarDataPoint } from '@/components/charts/radar-chart';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type FortyTwoSkill } from '@/services/oauth';
import { Spacing, useGlobalStyles } from '@/styles';

const SKILL_LEVEL_REFERENCE_MAX = 21;

interface ProfileSkillsSectionProps {
  skills: FortyTwoSkill[];
}

function buildRadarData(skills: FortyTwoSkill[]): RadarDataPoint[] {
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
  const radarData = useMemo(() => buildRadarData(skills), [skills]);

  return (
    <View style={[g.glassCard, styles.sectionCard]}>
      <ThemedText type="subtitle">Skills</ThemedText>
      {radarData.length >= 3 ? (
        <View style={styles.chartContainer}>
          <RadarChart data={radarData} />
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <ThemedText style={{ color: palette.textSecondary }}>Not enough skills to display a radar</ThemedText>
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
  );
}

const styles = StyleSheet.create({
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
});

import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DashboardStatsData } from '@/lib/dashboardStats';
import { useTheme } from '@/hooks/use-theme';

interface DashboardStatsProps {
  stats: DashboardStatsData;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const colors = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textStrong }]}>Estadísticas</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
          <Text style={[styles.statValue, { color: colors.textStrong }]}>
            {stats.totalEvaluations}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textWeak }]}>Evaluaciones</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
          <Text style={[styles.statValue, { color: colors.textStrong }]}>
            {stats.totalStudents}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textWeak }]}>Estudiantes</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
          <Text style={[styles.statValue, { color: colors.textStrong }]}>
            {stats.averageScore.toFixed(2)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textWeak }]}>Promedio</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
          <Text style={[styles.statValue, { color: colors.textStrong }]} numberOfLines={1}>
            {stats.lastEvaluationName || '—'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textWeak }]}>Última evaluación</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});

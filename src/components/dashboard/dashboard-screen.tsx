import * as React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Database from '@/database';
import { DashboardStats } from './dashboard-stats';
import { RecentEvaluations } from './recent-evaluations';
import { EmptyState } from './empty-state';
import {
  formatRecentEvaluations,
  buildDashboardStats,
  DashboardStatsData,
  RecentEvaluation,
} from '@/lib/dashboardStats';
import { useEvaluationsVersion } from '@/lib/evaluationsEvents';
import { confirmDeleteEvaluation } from '@/lib/confirmDeleteEvaluation';
import { useTheme } from '@/hooks/use-theme';

export const DashboardScreen: React.FC = () => {
  const colors = useTheme();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const evaluationsVersion = useEvaluationsVersion();
  const [stats, setStats] = React.useState<DashboardStatsData>({
    totalEvaluations: 0,
    totalStudents: 0,
    averageScore: 0,
    lastEvaluationName: null,
  });
  const [recent, setRecent] = React.useState<RecentEvaluation[]>([]);

  const loadDashboard = React.useCallback(
    (
      onResult: (data: { stats: DashboardStatsData; recent: RecentEvaluation[] }) => void,
      onError: (error: unknown) => void,
    ) => {
      Promise.all([
        Database.countEvaluations(),
        Database.countTotalStudents(),
        Database.getAverageScore(),
        Database.getRecentEvaluationsWithStats(),
      ])
        .then(([totalEvaluations, totalStudents, averageScore, recentEvals]) => {
          const formatted: RecentEvaluation[] = formatRecentEvaluations(recentEvals);
          onResult({
            stats: buildDashboardStats(totalEvaluations, totalStudents, averageScore, formatted),
            recent: formatted,
          });
        })
        .catch((err) => onError(err));
    },
    [],
  );

  React.useEffect(() => {
    let cancelled = false;
    loadDashboard(
      ({ stats, recent }) => {
        if (cancelled) return;
        setStats(stats);
        setRecent(recent);
        setLoading(false);
      },
      (err) => {
        if (!cancelled) {
          console.error('Error loading dashboard', err);
          setLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [loadDashboard, evaluationsVersion]);

  const handleCreateExam = () => {
    router.push('/exams');
  };

  const handleSelectEvaluation = (evaluationId: string) => {
    router.push(`/history?evaluationId=${evaluationId}`);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.backgroundMuted }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (stats.totalEvaluations === 0) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.backgroundMuted }]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: colors.textStrong }]}>Inicio</Text>
        <EmptyState onCreateExam={handleCreateExam} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundMuted }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.textStrong }]}>Inicio</Text>

      <DashboardStats stats={stats} />

      <TouchableOpacity
        style={[styles.newExamButton, { backgroundColor: colors.success }]}
        onPress={handleCreateExam}
        accessibilityRole="button"
        accessibilityLabel="Crear nueva evaluación"
      >
        <Text style={styles.newExamButtonText}>Nueva Evaluación</Text>
      </TouchableOpacity>

      <RecentEvaluations
        evaluations={recent}
        onSelectEvaluation={handleSelectEvaluation}
        onDeleteEvaluation={confirmDeleteEvaluation}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  newExamButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  newExamButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

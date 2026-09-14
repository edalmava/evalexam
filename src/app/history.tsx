import * as React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { HistoryScreen } from '@/components/evaluation/history-screen';
import { SummaryScreen } from '@/components/evaluation/summary-screen';
import { ExportExam } from '@/components/evaluation/export-exam';
import * as Database from '@/database';
import { useEvaluationsVersion } from '@/lib/evaluationsEvents';
import { confirmDeleteEvaluation } from '@/lib/confirmDeleteEvaluation';

export default function HistoryTabScreen() {
  const params = useLocalSearchParams<{ evaluationId?: string }>();
  const router = useRouter();
  const evaluationId = params.evaluationId;
  const evaluationsVersion = useEvaluationsVersion();
  const [evaluationName, setEvaluationName] = React.useState<string | undefined>();

  React.useEffect(() => {
    let active = true;
    if (evaluationId) {
      Database.selectEvaluation(evaluationId)
        .then((ev) => {
          if (!active) return;
          if (ev) {
            setEvaluationName(ev.name);
          } else {
            router.replace('/history');
          }
        })
        .catch((error) => {
          console.error('Error loading evaluation:', error);
        });
    }
    return () => {
      active = false;
    };
  }, [evaluationId, evaluationsVersion, router]);

  if (evaluationId) {
    return (
      <View style={styles.container}>
        <SummaryScreen evaluationId={evaluationId} />
        <ExportExam evaluationId={evaluationId} evaluationName={evaluationName} />
        <TouchableOpacity
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel="Eliminar evaluación"
          onPress={() => confirmDeleteEvaluation(evaluationId, evaluationName || '...')}
        >
          <Text style={styles.deleteButtonText}>Eliminar Evaluación</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HistoryScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  deleteButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

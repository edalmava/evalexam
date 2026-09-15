import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import * as Database from '@/database';
import { useEvaluationsVersion } from '@/lib/evaluationsEvents';
import { confirmDeleteEvaluation } from '@/lib/confirmDeleteEvaluation';

interface HistoryScreenProps {
  evaluationId?: string;
}

type HistoryEvaluation = Database.RecentEvaluationWithStatsRow;

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ evaluationId }) => {
  const colors = useTheme();

  const router = useRouter();
  const [evaluations, setEvaluations] = React.useState<HistoryEvaluation[]>([]);
  const [searchText, setSearchText] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const evaluationsVersion = useEvaluationsVersion();

  React.useEffect(() => {
    const loadEvaluations = async () => {
      try {
        const evals = await Database.getRecentEvaluationsWithStats();
        setEvaluations(evals);
        setLoading(false);
      } catch (err) {
        console.error('Error loading evaluations:', err);
        setLoading(false);
      }
    };

    loadEvaluations();
  }, [evaluationId, evaluationsVersion]);

  const filteredEvaluations = evaluations.filter((item) => {
    if (!searchText) return true;
    return item.name.toLowerCase().includes(searchText.toLowerCase());
  });

  const handleEvaluationPress = (evalId: string) => {
    router.push({ pathname: '/history', params: { evaluationId: evalId } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundMuted }]}>
      <Text style={[styles.title, { color: colors.textStrong }]}>Historial</Text>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Buscar evaluación..."
          placeholderTextColor={colors.textWeak}
          value={searchText}
          onChangeText={setSearchText}
          style={[
            styles.input,
            {
              borderColor: colors.borderStrong,
              backgroundColor: colors.background,
              color: colors.textStrong,
            },
          ]}
          accessibilityLabel="Buscar evaluación"
        />
      </View>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}

      <FlatList
        data={filteredEvaluations}
        renderItem={({ item }) => (
          <View style={[styles.evaluationItem, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={styles.evaluationBody}
              accessibilityRole="button"
              accessibilityLabel={`Abrir evaluación ${item.name}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => handleEvaluationPress(item.id)}
            >
              <View style={styles.evaluationInfo}>
                <Text style={[styles.evaluationName, { color: colors.textStrong }]}>
                  {item.name}
                </Text>
                <Text style={[styles.evaluationDetails, { color: colors.textWeak }]}>
                  {item.studentCount ?? 0} estudiantes • {(item.averageScore ?? 0).toFixed(2)}{' '}
                  promedio
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: colors.danger }]}
              accessibilityRole="button"
              accessibilityLabel={`Eliminar evaluación ${item.name}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => confirmDeleteEvaluation(item.id, item.name)}
            >
              <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        horizontal={false}
      />

      {evaluations.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textWeak }]}>
            No hay evaluaciones guardadas
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textWeak }]}>
            Pruebe crear una evaluación primero
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  loading: {
    marginVertical: 20,
  },
  evaluationItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  evaluationBody: {
    flex: 1,
  },
  deleteButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  evaluationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  evaluationName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  evaluationDetails: {
    fontSize: 12,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
  },
});

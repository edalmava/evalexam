import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RecentEvaluation } from '@/lib/dashboardStats';
import { useTheme } from '@/hooks/use-theme';

interface RecentEvaluationsProps {
  evaluations: RecentEvaluation[];
  onSelectEvaluation: (evaluationId: string) => void;
  onDeleteEvaluation: (evaluationId: string, name: string) => void;
}

export const RecentEvaluations: React.FC<RecentEvaluationsProps> = ({
  evaluations,
  onSelectEvaluation,
  onDeleteEvaluation,
}) => {
  const colors = useTheme();
  const renderItem = ({ item }: { item: RecentEvaluation }) => (
    <View key={item.id} style={[styles.evaluationItem, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={styles.evaluationBody}
        accessibilityRole="button"
        accessibilityLabel={`Abrir evaluación ${item.name}`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={() => onSelectEvaluation(item.id)}
      >
        <View style={styles.evaluationInfo}>
          <View style={styles.evaluationHeader}>
            <Text style={[styles.evaluationName, { color: colors.textStrong }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.status === 'draft' && (
              <Text
                style={[
                  styles.draftBadge,
                  { color: colors.warning, backgroundColor: colors.warningBackground },
                ]}
              >
                Evaluación encontrada sin guardar
              </Text>
            )}
          </View>
          <Text style={[styles.evaluationDetails, { color: colors.textWeak }]}>
            {item.date} • {item.studentCount} estudiantes •{' '}
            {item.averageScore != null ? item.averageScore.toFixed(2) : '0'} promedio
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.deleteButton, { borderColor: colors.danger }]}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar evaluación ${item.name}`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={() => onDeleteEvaluation(item.id, item.name)}
      >
        <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textStrong }]}>Evaluaciones Recientes</Text>
      {evaluations.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textWeak }]}>
          No hay evaluaciones recientes
        </Text>
      ) : (
        evaluations.map((item) => renderItem({ item }))
      )}
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
    gap: 4,
  },
  evaluationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  evaluationName: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  draftBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  evaluationDetails: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

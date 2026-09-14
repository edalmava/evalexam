import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface EmptyStateProps {
  onCreateExam?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateExam }) => {
  const colors = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.emptyText, { color: colors.textStrong }]}>
        No hay evaluaciones guardadas
      </Text>
      <Text style={[styles.emptySubText, { color: colors.textWeak }]}>
        Crea tu primera evaluación para comenzar a calificar
      </Text>
      {onCreateExam && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.success }]}
          accessibilityRole="button"
          accessibilityLabel="Crear primera evaluación"
          onPress={onCreateExam}
        >
          <Text style={styles.buttonText}>Crear Primera Evaluación</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 260,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

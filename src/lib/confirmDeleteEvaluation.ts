import { Alert } from 'react-native';
import * as Database from '@/database';
import { notifyEvaluationsChanged } from '@/lib/evaluationsEvents';

export const confirmDeleteEvaluation = (evaluationId: string, name: string) => {
  Alert.alert(
    'Eliminar evaluación',
    `¿Desea eliminar la evaluación "${name}"? Se eliminarán también sus estudiantes y el historial asociado.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await Database.deleteEvaluation(evaluationId);
            notifyEvaluationsChanged();
          } catch (error) {
            console.error('Error deleting evaluation:', error);
            Alert.alert('Error', 'No se pudo eliminar la evaluación');
          }
        },
      },
    ],
  );
};

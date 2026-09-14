import * as React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { EvaluationForm } from '@/components/evaluation/evaluation-form';
import { AnswerKey, AnswerKeyData } from '@/components/evaluation/answer-key';
import { StudentAnswers } from '@/components/evaluation/student-answers';
import { SummaryScreen } from '@/components/evaluation/summary-screen';
import { useTheme } from '@/hooks/use-theme';
import { notifyEvaluationsChanged } from '@/lib/evaluationsEvents';
import * as Database from '@/database';

interface EvaluationDraft {
  id: string;
  name: string;
  date: string;
  academicPeriod: string;
  totalQuestions: number;
  totalStudents: number;
  questionWeights: number[];
  gradingSystem: '0-to-max' | '1-to-max';
  maxScore: number;
  weightMode: 'equal' | 'different';
  correctAnswers?: string[];
}

const STEPS = ['Configuración', 'Clave de Respuestas', 'Respuestas de Estudiantes', 'Resumen'];

export const EvaluationWizard: React.FC = () => {
  const colors = useTheme();

  const [step, setStep] = React.useState(0);
  const [evaluation, setEvaluation] = React.useState<EvaluationDraft | null>(null);

  const handleConfigSave = (config: EvaluationDraft) => {
    setEvaluation({
      ...config,
      correctAnswers: evaluation?.correctAnswers || config.correctAnswers || [],
    });
    setStep(1);
  };

  const handleKeyDraftChange = React.useCallback((key: AnswerKeyData) => {
    // Los pesos son fuente de verdad del paso 1: el paso 2 solo aporta la clave.
    setEvaluation((prev) =>
      prev
        ? {
            ...prev,
            correctAnswers: key.correctAnswers,
          }
        : prev,
    );
  }, []);

  const handleAnswerKeySave = async (key: AnswerKeyData) => {
    if (!evaluation) return;
    try {
      await Database.updateEvaluationAnswerKey(evaluation.id, key.correctAnswers);
      setEvaluation((prev) =>
        prev
          ? {
              ...prev,
              correctAnswers: key.correctAnswers,
            }
          : prev,
      );
      setStep(2);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la clave: ' + (error as Error).message);
    }
  };

  const handleStudentAnswersSave = React.useCallback(() => {
    notifyEvaluationsChanged();
  }, []);

  const handleFinish = async () => {
    if (!evaluation) return;
    try {
      const students = await Database.selectStudentsByEvaluation(evaluation.id);
      const scores = students.map((student) => student.score || 0);
      const studentCount = students.length;
      const averageScore =
        scores.length > 0 ? scores.reduce((acc, val) => acc + val, 0) / scores.length : 0;
      await Database.insertHistory(
        evaluation.id,
        new Date().toISOString().split('T')[0],
        studentCount,
        averageScore,
      );
      notifyEvaluationsChanged();
      setEvaluation(null);
      setStep(0);
      Alert.alert('Éxito', 'Evaluación guardada en el historial');
    } catch (error) {
      Alert.alert('Error', 'No se pudo finalizar la evaluación: ' + (error as Error).message);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundMuted }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.textStrong }]}>Registrar Evaluación</Text>
        <Text style={[styles.stepCounter, { color: colors.textWeak }]}>
          Paso {step + 1} de {STEPS.length}: {STEPS[step]}
        </Text>
        <View style={styles.progressTrack}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressBar,
                { backgroundColor: index <= step ? colors.success : colors.border },
                index <= step ? styles.progressBarActive : styles.progressBarInactive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {step === 0 && (
          <EvaluationForm
            persist
            submitLabel="Guardar y Continuar"
            initialEvaluation={evaluation ?? undefined}
            onSave={handleConfigSave}
          />
        )}

        {step === 1 && evaluation && (
          <AnswerKey
            totalQuestions={evaluation.totalQuestions}
            initialWeights={evaluation.questionWeights}
            initialGradingSystem={evaluation.gradingSystem}
            initialMaxScore={evaluation.maxScore}
            initialCorrectAnswers={evaluation.correctAnswers}
            initialWeightMode={evaluation.weightMode}
            onChange={handleKeyDraftChange}
            submitLabel="Guardar Clave y Continuar"
            onSave={handleAnswerKeySave}
          />
        )}

        {step === 2 && evaluation && (
          <StudentAnswers
            evaluationId={evaluation.id}
            totalQuestions={evaluation.totalQuestions}
            onSave={handleStudentAnswersSave}
          />
        )}

        {step === 3 && evaluation && (
          <View>
            <SummaryScreen evaluationId={evaluation.id} />
            <TouchableOpacity
              style={[styles.finishButton, { backgroundColor: colors.success }]}
              onPress={handleFinish}
              accessibilityRole="button"
              accessibilityLabel="Finalizar y guardar en historial"
            >
              <Text style={styles.finishButtonText}>Finalizar y Guardar en Historial</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {step > 0 && (
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.backButton,
              { borderColor: colors.borderStrong, backgroundColor: colors.background },
            ]}
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Volver al paso anterior"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.backButtonText, { color: colors.textStrong }]}>Atrás</Text>
          </TouchableOpacity>

          {step === 2 && evaluation && (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: colors.success }]}
              onPress={() => setStep(3)}
              accessibilityRole="button"
              accessibilityLabel="Ver resumen"
            >
              <Text style={styles.nextButtonText}>Ver Resumen</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  stepCounter: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  progressTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  progressBarActive: {},
  progressBarInactive: {},
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    padding: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  finishButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

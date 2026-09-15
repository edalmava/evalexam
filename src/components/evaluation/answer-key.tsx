import * as React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { validateWeights, getDefaultWeight } from '@/lib/weightValidation';

interface AnswerKeyProps {
  totalQuestions: number;
  onSave: (key: AnswerKeyData) => void;
  initialWeights?: number[];
  initialGradingSystem?: '0-to-max' | '1-to-max';
  initialMaxScore?: number;
  initialCorrectAnswers?: string[];
  initialWeightMode?: 'equal' | 'different';
  onChange?: (key: AnswerKeyData) => void;
  submitLabel?: string;
}

export interface AnswerKeyData {
  correctAnswers: string[]; // Array de respuestas correctas (A, B, C, D) por pregunta
  weights: number[]; // Pesos de cada pregunta (solo lectura: provienen del paso 1)
}

export const AnswerKey: React.FC<AnswerKeyProps> = ({
  totalQuestions,
  onSave,
  initialWeights,
  initialGradingSystem,
  initialMaxScore,
  initialCorrectAnswers,
  initialWeightMode,
  onChange,
  submitLabel = 'Guardar Clave de Respuestas',
}) => {
  const colors = useTheme();

  // La clave de respuestas es el ÚNICO dato editable en el paso 2.
  const [correctAnswers, setCorrectAnswers] = React.useState<string[]>(() =>
    initialCorrectAnswers && initialCorrectAnswers.length === totalQuestions
      ? [...initialCorrectAnswers]
      : new Array(totalQuestions).fill('A'),
  );

  // Todo lo demás se lee del paso 1 (props), sin estado local mutable.
  const gradingSystem = initialGradingSystem || '0-to-max';
  const maxScore = initialMaxScore || 5;
  const hasPerQuestionWeights = initialWeights ? initialWeights.length > 1 : totalQuestions > 1;
  const weightMode = initialWeightMode || (hasPerQuestionWeights ? 'different' : 'equal');

  const equalWeight = getDefaultWeight(gradingSystem, maxScore, totalQuestions);

  const weights = React.useMemo(() => {
    if (totalQuestions <= 0) return [];
    if (weightMode === 'equal') {
      return new Array(totalQuestions).fill(equalWeight);
    }
    return initialWeights && initialWeights.length >= totalQuestions
      ? initialWeights
      : new Array(totalQuestions).fill(equalWeight);
  }, [weightMode, totalQuestions, equalWeight, initialWeights]);

  const buildKeyData = React.useCallback((): AnswerKeyData => {
    return {
      correctAnswers,
      weights,
    };
  }, [correctAnswers, weights]);

  React.useEffect(() => {
    onChange?.(buildKeyData());
  }, [buildKeyData, onChange]);

  const handleSave = () => {
    try {
      onSave(buildKeyData());
      Alert.alert('Éxito', 'Clave de respuestas guardada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la clave: ' + (error as Error).message);
    }
  };

  const validation = maxScore > 0 ? validateWeights(weights, gradingSystem, maxScore) : null;

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.scrollViewStyle}>
      <Text style={[styles.title, { color: colors.textStrong }]}>Clave de Respuestas</Text>

      {/* Sistema de calificación (solo lectura: se configura en el paso 1) */}
      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Sistema de calificación
        </Text>
        <View
          style={[
            styles.readOnlyRow,
            { borderColor: colors.border, backgroundColor: colors.backgroundMuted },
          ]}
        >
          <Text style={[styles.readOnlyValue, { color: colors.textStrong }]}>
            {gradingSystem === '0-to-max' ? 'Sistema 0 a nota máxima' : 'Sistema 1 a nota máxima'}
          </Text>
        </View>
        <Text style={[styles.sectionHint, { color: colors.textWeak }]}>
          Solo se modifica en Configuración (paso 1)
        </Text>
      </View>

      {/* Nota máxima (solo lectura: se configura en el paso 1) */}
      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Nota máxima</Text>
        <View
          style={[
            styles.readOnlyRow,
            { borderColor: colors.border, backgroundColor: colors.backgroundMuted },
          ]}
        >
          <Text style={[styles.readOnlyValue, { color: colors.textStrong }]}>{maxScore}</Text>
        </View>
        <Text style={[styles.sectionHint, { color: colors.textWeak }]}>
          Solo se modifica en Configuración (paso 1)
        </Text>
      </View>

      {/* Número de preguntas (solo lectura: se configura en el paso 1) */}
      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Número de preguntas
        </Text>
        <View
          style={[
            styles.readOnlyRow,
            { borderColor: colors.border, backgroundColor: colors.backgroundMuted },
          ]}
        >
          <Text style={[styles.readOnlyValue, { color: colors.textStrong }]}>{totalQuestions}</Text>
        </View>
        <Text style={[styles.sectionHint, { color: colors.textWeak }]}>
          Solo se modifica en Configuración (paso 1)
        </Text>
      </View>

      {/* Peso de preguntas (solo lectura: proviene del paso 1) */}
      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Peso de preguntas
        </Text>
        <View
          style={[
            styles.readOnlyRow,
            { borderColor: colors.border, backgroundColor: colors.backgroundMuted },
          ]}
        >
          <Text style={[styles.readOnlyValue, { color: colors.textStrong }]}>
            {weightMode === 'equal' ? 'Igual peso para todas' : 'Diferente por pregunta'}
          </Text>
        </View>
        <Text style={[styles.sectionHint, { color: colors.textWeak }]}>
          El tipo de peso y sus valores solo se modifican en Configuración (paso 1)
        </Text>

        {/* Pesos individuales (solo lectura) */}
        {weightMode === 'different' && (
          <View style={styles.weightsIndividual}>
            <Text style={[styles.subLabel, { color: colors.textWeak }]}>
              Peso por pregunta (1 a {weights.length}):
            </Text>
            {weights.map((weight, index) => (
              <View key={index} style={styles.weightRow}>
                <Text style={[styles.weightLabel, { color: colors.textSecondary }]}>
                  Pregunta {index + 1}:
                </Text>
                <Text
                  style={[
                    styles.readOnlyWeightValue,
                    {
                      color: colors.textStrong,
                      borderColor: colors.border,
                      backgroundColor: colors.backgroundMuted,
                    },
                  ]}
                >
                  {weight}
                </Text>
              </View>
            ))}
            {validation && (
              <Text
                style={[
                  styles.weightValidation,
                  { color: validation.exceeds ? colors.danger : colors.success },
                  validation.exceeds ? styles.weightValidationError : styles.weightValidationOk,
                ]}
              >
                Peso total: {validation.totalWeight} de {validation.limit} permitido
              </Text>
            )}
          </View>
        )}

        {/* Peso único si son iguales (calculado por fórmula, no editable) */}
        {weightMode === 'equal' && (
          <View style={styles.weightSingle}>
            <Text style={[styles.subLabel, { color: colors.textWeak }]}>
              Peso por pregunta (calculado automáticamente):
            </Text>
            <Text style={[styles.equalWeightValue, { color: colors.success }]}>{equalWeight}</Text>
            <Text style={[styles.weightNote, { color: colors.textWeak }]}>
              {gradingSystem === '0-to-max'
                ? `Nota máxima ÷ número de preguntas = ${maxScore} ÷ ${totalQuestions}`
                : `(Nota máxima − 1) ÷ número de preguntas = (${maxScore} − 1) ÷ ${totalQuestions}`}
            </Text>
            <Text style={[styles.weightNote, { color: colors.textWeak }]}>
              (Todas las preguntas tendrán este mismo peso)
            </Text>
          </View>
        )}
      </View>

      {/* Clave de respuestas - selector por pregunta */}
      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Respuesta correcta por pregunta
        </Text>
        {correctAnswers.map((answer, index) => (
          <View key={index} style={styles.answerRow}>
            <Text style={[styles.questionLabel, { color: colors.textSecondary }]}>
              Pregunta {index + 1}:
            </Text>
            <View style={styles.answerOptions}>
              {(['A', 'B', 'C', 'D'] as const).map((option) => {
                const selected = option === answer;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.answerOption,
                      {
                        borderColor: selected ? colors.success : colors.borderStrong,
                        backgroundColor: selected ? colors.successBackground : colors.background,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Pregunta ${index + 1}, opción ${option}`}
                    accessibilityState={{ selected }}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    onPress={() =>
                      setCorrectAnswers(correctAnswers.map((a, i) => (i === index ? option : a)))
                    }
                  >
                    <Text
                      style={[
                        styles.answerOptionText,
                        { color: selected ? colors.success : colors.textSecondary },
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: colors.success, borderColor: colors.success },
        ]}
        onPress={handleSave}
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
      >
        <Text style={styles.saveButtonText}>{submitLabel}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewStyle: {
    paddingBottom: 20,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 12,
    marginTop: 3,
  },
  readOnlyRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 6,
  },
  readOnlyValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  weightValidation: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  weightValidationOk: {},
  weightValidationError: {},
  weightSingle: {
    marginTop: 5,
  },
  equalWeightValue: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 4,
  },
  weightNote: {
    fontSize: 12,
    marginTop: 3,
  },
  weightsIndividual: {
    marginTop: 5,
  },
  subLabel: {
    fontSize: 12,
    marginBottom: 3,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  weightLabel: {
    flex: 1,
    fontSize: 12,
    marginRight: 8,
  },
  readOnlyWeightValue: {
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: 4,
    textAlign: 'center',
    minWidth: 58,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  answerOptions: {
    flexDirection: 'row',
  },
  answerOption: {
    width: 40,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  answerOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  questionLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  answerRow: {
    marginBottom: 8,
  },
  saveButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

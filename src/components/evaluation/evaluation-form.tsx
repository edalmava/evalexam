import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import * as Database from '../../database';
import { validateWeights, getDefaultWeight } from '../../lib/weightValidation';
import { sanitizeDecimalText, parseDecimalText } from '../../lib/numberInput';
import { useTheme } from '@/hooks/use-theme';
import { createId } from '@/lib/ids';

interface EvaluationFormProps {
  initialEvaluation?: {
    id?: string;
    name?: string;
    date?: string;
    academicPeriod?: string;
    totalQuestions?: number;
    totalStudents?: number;
    questionWeights?: number[];
    gradingSystem?: '0-to-max' | '1-to-max';
    maxScore?: number;
    weightMode?: 'equal' | 'different';
  };
  initialWeightMode?: 'equal' | 'different';
  persist?: boolean;
  submitLabel?: string;
  onSave: (evaluation: {
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
  }) => void;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  initialEvaluation,
  initialWeightMode,
  persist = true,
  submitLabel = 'Guardar Evaluación',
  onSave,
}) => {
  const colors = useTheme();

  const [name, setName] = React.useState(initialEvaluation?.name || '');
  const [date, setDate] = React.useState(
    initialEvaluation?.date || new Date().toISOString().split('T')[0],
  );
  const [academicPeriod, setAcademicPeriod] = React.useState<string>(
    initialEvaluation?.academicPeriod || 'Primer Período',
  );
  const [totalQuestionsText, setTotalQuestionsText] = React.useState<string>(
    initialEvaluation?.totalQuestions?.toString() || '10',
  );
  const [totalStudentsText, setTotalStudentsText] = React.useState<string>(
    initialEvaluation?.totalStudents?.toString() || '1',
  );
  const [weightsText, setWeightsText] = React.useState<string[]>(
    initialEvaluation?.questionWeights ? initialEvaluation.questionWeights.map(String) : [],
  );
  const [editedWeights, setEditedWeights] = React.useState<Set<number>>(
    () =>
      new Set(
        initialEvaluation?.questionWeights
          ? initialEvaluation.questionWeights.map((_, index) => index)
          : [],
      ),
  );
  const [weightMode, setWeightMode] = React.useState<'equal' | 'different'>(
    initialWeightMode ||
      initialEvaluation?.weightMode ||
      (initialEvaluation?.questionWeights && initialEvaluation.questionWeights.length > 1
        ? 'different'
        : 'equal'),
  );
  const [gradingSystem, setGradingSystem] = React.useState<'0-to-max' | '1-to-max'>(
    initialEvaluation?.gradingSystem || '0-to-max',
  );
  const [maxScoreText, setMaxScoreText] = React.useState<string>(
    initialEvaluation?.maxScore?.toString() || '5',
  );

  const totalQuestions = parseInt(totalQuestionsText, 10) || 0;
  const totalStudents = parseInt(totalStudentsText, 10) || 0;
  const maxScore = parseInt(maxScoreText, 10) || 0;

  const weightCount = totalQuestions > 0 ? totalQuestions : 0;

  const defaultWeightText = React.useMemo(() => {
    const baseWeight = getDefaultWeight(gradingSystem, maxScore, weightCount);
    return baseWeight > 0 ? String(baseWeight) : '1';
  }, [gradingSystem, maxScore, weightCount]);

  const effectiveWeightTexts = React.useMemo(() => {
    if (weightMode !== 'different') {
      return [];
    }
    return Array.from({ length: weightCount }, (_, index) =>
      editedWeights.has(index) ? (weightsText[index] ?? defaultWeightText) : defaultWeightText,
    );
  }, [weightMode, weightCount, editedWeights, weightsText, defaultWeightText]);

  const questionWeights = React.useMemo(() => {
    if (weightMode === 'equal') {
      return [getDefaultWeight(gradingSystem, maxScore, weightCount)];
    }
    return effectiveWeightTexts.map((text) => parseDecimalText(text, 1));
  }, [weightMode, gradingSystem, maxScore, weightCount, effectiveWeightTexts]);

  const periods: string[] = [
    'Primer Período',
    'Segundo Período',
    'Tercer Período',
    'Cuarto Período',
  ];

  const gradingSystems: { label: string; value: '0-to-max' | '1-to-max' }[] = [
    { label: 'Sistema 0 a nota máxima', value: '0-to-max' },
    { label: 'Sistema 1 a nota máxima', value: '1-to-max' },
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la prueba es obligatorio');
      return;
    }
    if (!totalQuestions || totalQuestions <= 0) {
      Alert.alert('Error', 'El número de preguntas debe ser un número mayor a 0');
      return;
    }
    if (!totalStudents || totalStudents <= 0) {
      Alert.alert('Error', 'El número de estudiantes debe ser un número mayor a 0');
      return;
    }
    if (!maxScore || maxScore <= 0) {
      Alert.alert('Error', 'La nota máxima debe ser un número mayor a 0');
      return;
    }

    const weights =
      weightMode === 'equal'
        ? new Array(totalQuestions).fill(questionWeights[0] || 1)
        : questionWeights;

    const evaluation = {
      id: initialEvaluation?.id || createId(),
      name: name.trim(),
      date,
      academicPeriod,
      totalQuestions,
      totalStudents,
      questionWeights: weights,
      gradingSystem,
      maxScore,
      weightMode,
    };

    try {
      if (persist) {
        if (initialEvaluation?.id) {
          await Database.updateEvaluation(
            evaluation.id,
            evaluation.name,
            evaluation.date,
            evaluation.academicPeriod,
            evaluation.totalQuestions,
            evaluation.totalStudents,
            evaluation.gradingSystem,
            evaluation.maxScore,
            evaluation.questionWeights,
          );
        } else {
          await Database.insertEvaluation(
            evaluation.id,
            evaluation.name,
            evaluation.date,
            evaluation.academicPeriod,
            evaluation.totalQuestions,
            evaluation.totalStudents,
            evaluation.gradingSystem,
            evaluation.maxScore,
            evaluation.questionWeights,
          );
        }
      }
      onSave(evaluation);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la evaluación: ' + (error as Error).message);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundMuted }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.textStrong }]}>Crear Evaluación</Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Nombre de la prueba</Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.borderStrong, backgroundColor: colors.background },
          ]}
          value={name}
          onChangeText={(text) => setName(text)}
          placeholder="Ej: Matemáticas Basicas"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Fecha de la prueba</Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.borderStrong, backgroundColor: colors.background },
          ]}
          value={date}
          onChangeText={(text) => setDate(text)}
          placeholder="AAAA-MM-DD"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Período académico</Text>
        {periods.map((period) => {
          const selected = period === academicPeriod;
          return (
            <TouchableOpacity
              key={period}
              style={[
                styles.optionRow,
                {
                  borderColor: selected ? colors.success : colors.border,
                  backgroundColor: selected ? colors.successBackground : colors.background,
                },
                selected && styles.optionRowSelected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={period}
              accessibilityState={{ selected }}
              onPress={() => setAcademicPeriod(period)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: selected ? colors.success : colors.textSecondary },
                  selected && styles.optionTextSelected,
                ]}
              >
                {period}
              </Text>
              <Text
                style={[
                  styles.optionCheck,
                  { color: selected ? colors.success : colors.borderStrong },
                  selected && styles.optionCheckVisible,
                ]}
              >
                {selected ? '✓' : '○'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Número de preguntas</Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.borderStrong, backgroundColor: colors.background },
          ]}
          value={totalQuestionsText}
          onChangeText={setTotalQuestionsText}
          keyboardType="numeric"
          placeholder="Ej: 40"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Número de estudiantes</Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.borderStrong, backgroundColor: colors.background },
          ]}
          value={totalStudentsText}
          onChangeText={setTotalStudentsText}
          keyboardType="numeric"
          placeholder="Ej: 30"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Sistema de calificación</Text>
        {gradingSystems.map(({ label, value }) => {
          const selected = value === gradingSystem;
          return (
            <TouchableOpacity
              key={value}
              style={[
                styles.optionRow,
                {
                  borderColor: selected ? colors.success : colors.border,
                  backgroundColor: selected ? colors.successBackground : colors.background,
                },
                selected && styles.optionRowSelected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              onPress={() => setGradingSystem(value)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: selected ? colors.success : colors.textSecondary },
                  selected && styles.optionTextSelected,
                ]}
              >
                {label}
              </Text>
              <Text
                style={[
                  styles.optionCheck,
                  { color: selected ? colors.success : colors.borderStrong },
                  selected && styles.optionCheckVisible,
                ]}
              >
                {selected ? '✓' : '○'}
              </Text>
            </TouchableOpacity>
          );
        })}
        <Text style={[styles.hint, { color: colors.textWeak }]}>
          Nota máxima configurable (ej. 5, 10, 20, 100)
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Nota máxima</Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.borderStrong, backgroundColor: colors.background },
          ]}
          value={maxScoreText}
          onChangeText={setMaxScoreText}
          keyboardType="numeric"
          placeholder="Ej: 5"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Peso de preguntas</Text>
        <TouchableOpacity
          style={[
            styles.optionRow,
            {
              borderColor: weightMode === 'equal' ? colors.success : colors.border,
              backgroundColor:
                weightMode === 'equal' ? colors.successBackground : colors.background,
            },
            weightMode === 'equal' && styles.optionRowSelected,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Peso igual para todas las preguntas"
          accessibilityState={{ selected: weightMode === 'equal' }}
          onPress={() => {
            setWeightMode('equal');
            setWeightsText([]);
            setEditedWeights(new Set());
          }}
        >
          <Text
            style={[
              styles.optionText,
              { color: weightMode === 'equal' ? colors.success : colors.textSecondary },
              weightMode === 'equal' && styles.optionTextSelected,
            ]}
          >
            Igual peso para todas
          </Text>
          <Text
            style={[
              styles.optionCheck,
              { color: weightMode === 'equal' ? colors.success : colors.borderStrong },
              weightMode === 'equal' && styles.optionCheckVisible,
            ]}
          >
            {weightMode === 'equal' ? '✓' : '○'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionRow,
            {
              borderColor: weightMode === 'different' ? colors.success : colors.border,
              backgroundColor:
                weightMode === 'different' ? colors.successBackground : colors.background,
            },
            weightMode === 'different' && styles.optionRowSelected,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Peso diferente por pregunta"
          accessibilityState={{ selected: weightMode === 'different' }}
          onPress={() => setWeightMode('different')}
        >
          <Text
            style={[
              styles.optionText,
              { color: weightMode === 'different' ? colors.success : colors.textSecondary },
              weightMode === 'different' && styles.optionTextSelected,
            ]}
          >
            Diferente por pregunta
          </Text>
          <Text
            style={[
              styles.optionCheck,
              { color: weightMode === 'different' ? colors.success : colors.borderStrong },
              weightMode === 'different' && styles.optionCheckVisible,
            ]}
          >
            {weightMode === 'different' ? '✓' : '○'}
          </Text>
        </TouchableOpacity>
      </View>

      {weightMode === 'different' && (
        <View style={styles.weightsContainer}>
          <Text style={[styles.subLabel, { color: colors.textWeak }]}>
            Asignar peso por pregunta:
          </Text>
          {effectiveWeightTexts.map((weightText, index) => (
            <View key={index} style={styles.weightRow}>
              <Text style={[styles.weightLabel, { color: colors.textSecondary }]}>
                Pregunta {index + 1}:
              </Text>
              <TextInput
                style={[
                  styles.weightInput,
                  {
                    borderColor: colors.borderStrong,
                    color: colors.textStrong,
                    backgroundColor: colors.background,
                  },
                ]}
                value={weightText}
                onChangeText={(text) => {
                  const newWeights = [...weightsText];
                  newWeights[index] = sanitizeDecimalText(text);
                  setWeightsText(newWeights);
                  setEditedWeights((prev) => new Set(prev).add(index));
                }}
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
          ))}
          {maxScore > 0 && (
            <Text
              style={[
                styles.weightValidation,
                {
                  color: validateWeights(questionWeights, gradingSystem, maxScore).exceeds
                    ? colors.danger
                    : colors.success,
                },
                validateWeights(questionWeights, gradingSystem, maxScore).exceeds
                  ? styles.weightValidationError
                  : styles.weightValidationOk,
              ]}
            >
              Peso total: {validateWeights(questionWeights, gradingSystem, maxScore).totalWeight} de{' '}
              {validateWeights(questionWeights, gradingSystem, maxScore).limit} permitido
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.success }]}
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
  container: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  subLabel: {
    fontSize: 14,
    marginBottom: 3,
  },
  hint: {
    fontSize: 12,
    marginTop: 3,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 6,
  },
  optionRowSelected: {
    borderWidth: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  optionCheck: {
    fontSize: 16,
    marginLeft: 8,
  },
  optionCheckVisible: {},
  weightsContainer: {
    marginBottom: 15,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  weightLabel: {
    flex: 1,
    fontSize: 14,
    marginRight: 10,
  },
  weightInput: {
    width: 58,
    height: 34,
    minWidth: 58,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 16,
  },
  weightValidation: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  weightValidationOk: {},
  weightValidationError: {},
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 16,
    marginTop: 5,
    marginBottom: 10,
  },
  saveButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

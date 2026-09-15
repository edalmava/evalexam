import * as React from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Button } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import * as Database from '@/database';
import { importStudentsFromCSV } from '@/lib/importStudents';
import { buildStudentPlaceholders } from '@/lib/studentPlaceholders';
import { calculateScore } from '@/lib/calculateScore';
import { createId } from '@/lib/ids';
import { ScanAnswerSheetModal, ScanEvaluationMeta } from './scan-answer-sheet-modal';

interface EvaluationMeta {
  gradingSystem: '0-to-max' | '1-to-max';
  maxScore: number;
  weights: number[];
  correctAnswers: string[];
}

interface StudentAnswersProps {
  evaluationId: string;
  totalQuestions: number;
  onSave: (student: { id: string; code: string; name: string; answers: string[] }) => void;
}

export const StudentAnswers: React.FC<StudentAnswersProps> = ({
  evaluationId,
  totalQuestions,
  onSave,
}) => {
  const colors = useTheme();

  const [students, setStudents] = React.useState<Database.StudentRow[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<string | null>(null);
  const [studentAnswers, setStudentAnswers] = React.useState<string[]>([]);
  const [evaluationMeta, setEvaluationMeta] = React.useState<EvaluationMeta | null>(null);
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [newStudentCode, setNewStudentCode] = React.useState('');
  const [newStudentName, setNewStudentName] = React.useState('');
  const [studentCode, setStudentCode] = React.useState('');
  const [studentName, setStudentName] = React.useState('');
  const [showScanModal, setShowScanModal] = React.useState(false);

  const applyStudentsSelection = React.useCallback(
    (records: Database.StudentRow[], focusId?: string) => {
      setStudents(records);
      if (records.length === 0) {
        setSelectedStudent(null);
        setShowImportModal(true);
        return;
      }
      const target = focusId ? (records.find((s) => s.id === focusId) ?? records[0]) : records[0];
      setSelectedStudent(target.id);
      setStudentCode(target.code);
      setStudentName(target.name);
      const saved = JSON.parse(target.answers || '[]') as string[];
      setStudentAnswers(
        saved.length === totalQuestions ? saved : new Array(totalQuestions).fill(''),
      );
    },
    [totalQuestions],
  );

  const fetchOrCreateStudents = React.useCallback(async (): Promise<Database.StudentRow[]> => {
    let records = await Database.selectStudentsByEvaluation(evaluationId);

    if (records.length === 0) {
      const evaluation = await Database.selectEvaluation(evaluationId);
      const totalStudents = Number(evaluation?.totalStudents) || 0;
      for (const placeholder of buildStudentPlaceholders(totalStudents)) {
        await Database.insertStudent({
          id: createId(),
          evaluationId,
          code: placeholder.code,
          name: placeholder.name,
          photoPath: null,
          answers: [],
        });
      }
      records = await Database.selectStudentsByEvaluation(evaluationId);
    }

    return records;
  }, [evaluationId]);

  // Cargar metadatos de la evaluación (sistema, nota máxima, pesos y clave)
  React.useEffect(() => {
    let active = true;
    Database.selectEvaluation(evaluationId)
      .then((evaluation) => {
        if (!active || !evaluation) return;
        setEvaluationMeta({
          gradingSystem: evaluation.gradingSystem as '0-to-max' | '1-to-max',
          maxScore: Number(evaluation.maxScore),
          weights: JSON.parse(evaluation.questionWeights || '[]') as number[],
          correctAnswers: JSON.parse(evaluation.correctAnswers || '[]') as string[],
        });
      })
      .catch(() => {
        if (active) {
          setEvaluationMeta(null);
        }
      });
    return () => {
      active = false;
    };
  }, [evaluationId]);

  // Cargar estudiantes de esta evaluación; si no hay y totalStudents > 0, pre-generar placeholders.
  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const records = await fetchOrCreateStudents();
        if (active) {
          applyStudentsSelection(records);
        }
      } catch (error) {
        if (active) {
          Alert.alert(
            'Error',
            'No se pudieron cargar los estudiantes: ' + (error as Error).message,
          );
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchOrCreateStudents, applyStudentsSelection]);

  const selectStudent = (studentId: string) => {
    const record = students.find((s) => s.id === studentId);
    if (!record) return;
    setSelectedStudent(studentId);
    setStudentCode(record.code);
    setStudentName(record.name);
    const existingAnswers = JSON.parse(record.answers || '[]') as string[];
    setStudentAnswers(
      existingAnswers.length === totalQuestions
        ? existingAnswers
        : new Array(totalQuestions).fill(''),
    );
  };

  const liveScore = React.useMemo(() => {
    if (!evaluationMeta || evaluationMeta.correctAnswers.length !== totalQuestions) return null;
    const correctAnswers = evaluationMeta.correctAnswers;
    const correctPerQuestion = Array.from(
      { length: totalQuestions },
      (_, i) => studentAnswers[i] === correctAnswers[i],
    );
    const correct = correctPerQuestion.filter(Boolean).length;
    const useWeights =
      evaluationMeta.weights.length === totalQuestions ? evaluationMeta.weights : null;
    return calculateScore({
      system: evaluationMeta.gradingSystem,
      maxScore: evaluationMeta.maxScore,
      totalQuestions,
      correct,
      correctPerQuestion,
      weights: useWeights,
    }).score;
  }, [evaluationMeta, studentAnswers, totalQuestions]);

  // Crear un estudiante individual
  const handleCreateStudent = async () => {
    const code = newStudentCode.trim();
    const name = newStudentName.trim();
    if (!code) {
      Alert.alert('Error', 'Ingrese el código del estudiante');
      return;
    }
    try {
      const id = createId();
      await Database.insertStudent({
        id,
        evaluationId,
        code,
        name,
        photoPath: null,
        answers: [],
      });
      setNewStudentCode('');
      setNewStudentName('');
      setShowImportModal(false);
      const records = await fetchOrCreateStudents();
      applyStudentsSelection(records, id);
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el estudiante: ' + (error as Error).message);
    }
  };

  // Importar estudiantes desde CSV
  const handleImportStudents = async (csvString: string) => {
    try {
      const students = importStudentsFromCSV(csvString);
      if (students.length > 0) {
        for (const student of students) {
          await Database.insertStudent({
            id: student.id,
            evaluationId: evaluationId,
            code: student.code,
            name: student.name,
            photoPath: null,
            answers: [],
          });
        }
        const records = await fetchOrCreateStudents();
        applyStudentsSelection(records);
        setShowImportModal(false);
        setNewStudentCode('');
        setNewStudentName('');
      }
    } catch (error) {
      Alert.alert('Error de CSV', 'No se pudo importar el CSV: ' + (error as Error).message);
    }
  };

  // Guardar respuestas del estudiante seleccionado
  const handleSaveAnswers = async () => {
    if (!selectedStudent) {
      Alert.alert('Error', 'Seleccione un estudiante primero');
      return;
    }
    if (studentAnswers.length === 0) {
      Alert.alert('Error', 'Marque al menos una respuesta');
      return;
    }
    const code = studentCode.trim();
    const name = studentName.trim();
    if (!code) {
      Alert.alert('Error', 'Ingrese el código del estudiante');
      return;
    }
    if (!name) {
      Alert.alert('Error', 'Ingrese el nombre del estudiante');
      return;
    }

    try {
      const evaluation = await Database.selectEvaluation(evaluationId);
      if (!evaluation) {
        Alert.alert('Error', 'No se encontró la evaluación');
        return;
      }
      const gradingSystem = evaluation.gradingSystem as '0-to-max' | '1-to-max';
      const maxScore = Number(evaluation.maxScore);
      const weights = JSON.parse(evaluation.questionWeights || '[]') as number[];
      const useWeights = weights.length === totalQuestions ? weights : null;

      // Comparar con la clave de respuestas de la evaluación
      const correctAnswers = JSON.parse(evaluation.correctAnswers || '[]') as string[];
      const hasKey = correctAnswers.length === totalQuestions;
      let score = 0;
      if (hasKey) {
        const correctPerQuestion = Array.from(
          { length: totalQuestions },
          (_, i) => studentAnswers[i] === correctAnswers[i],
        );
        const correct = correctPerQuestion.filter(Boolean).length;
        score = calculateScore({
          system: gradingSystem,
          maxScore,
          totalQuestions,
          correct,
          correctPerQuestion,
          weights: useWeights,
        }).score;
      }

      await Database.updateStudentAnswers(selectedStudent, studentAnswers, score);
      await Database.updateStudent(selectedStudent, code, name);

      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent
            ? { ...s, answers: JSON.stringify(studentAnswers), code, name }
            : s,
        ),
      );

      const student = {
        id: selectedStudent,
        code,
        name,
        answers: studentAnswers,
      };
      onSave(student);
      Alert.alert('Éxito', 'Respuestas y nota guardadas correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar las respuestas: ' + (error as Error).message);
    }
  };

  // Respuestas detectadas por el escaneo IA (RF-15..RF-21): actualiza el estado
  // local y notifica como el flujo manual (misma ruta de cálculo de nota).
  const handleScanSaved = React.useCallback(
    (answers: string[]) => {
      if (!selectedStudent) return;
      setStudentAnswers(answers);
      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent
            ? { ...s, answers: JSON.stringify(answers), answersSource: 'ai_scan' }
            : s,
        ),
      );
      onSave({ id: selectedStudent, code: studentCode, name: studentName, answers });
    },
    [selectedStudent, studentCode, studentName, onSave],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundMuted }]}>
      <Text style={[styles.title, { color: colors.textStrong }]}>
        Seleccionar Estudiante y Respuestas
      </Text>

      {/* Sección: Importar estudiantes */}
      {showImportModal && (
        <View
          style={[
            styles.modalContainer,
            { borderColor: colors.borderStrong, backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.textStrong }]}>
            Importar estudiantes
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.borderStrong,
                backgroundColor: colors.background,
                color: colors.textStrong,
              },
            ]}
            placeholder="Código, nombre (uno por línea o CSV)"
            placeholderTextColor={colors.textWeak}
            value={newStudentCode}
            onChangeText={setNewStudentCode}
            multiline
            numberOfLines={3}
          />
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.borderStrong,
                backgroundColor: colors.background,
                color: colors.textStrong,
              },
            ]}
            placeholder="Nombre del estudiante"
            placeholderTextColor={colors.textWeak}
            value={newStudentName}
            onChangeText={setNewStudentName}
            multiline
            numberOfLines={1}
          />
          <View style={styles.buttons}>
            <Button title="Usar CSV" onPress={() => handleImportStudents(newStudentCode)} />
            <Button title="Crear estudiante" onPress={handleCreateStudent} />
          </View>
        </View>
      )}

      {/* Sección: Estudiantes existentes */}
      <View style={styles.studentsSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Estudiantes en esta evaluación
        </Text>
        {students.length === 0 ? (
          <Button title="Añadir nuevo estudiante" onPress={() => setShowImportModal(true)} />
        ) : (
          <>
            {students.map((student) => {
              const isSelected = student.id === selectedStudent;
              const hasSavedAnswers = student.answers !== '[]';
              return (
                <TouchableOpacity
                  key={student.id}
                  style={[
                    styles.studentRow,
                    {
                      borderColor: isSelected ? colors.success : colors.border,
                      backgroundColor: isSelected ? colors.successBackground : colors.background,
                    },
                    isSelected && styles.studentRowSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${student.code} ${student.name}`}
                  accessibilityState={{ selected: isSelected }}
                  hitSlop={{ top: 4, bottom: 4 }}
                  onPress={() => selectStudent(student.id)}
                >
                  <Text
                    style={[
                      styles.studentRowText,
                      { color: isSelected ? colors.success : colors.textSecondary },
                      isSelected && styles.studentRowTextSelected,
                    ]}
                  >
                    {student.code
                      ? `${student.code} — ${student.name || 'Sin nombre'}`
                      : student.name}
                  </Text>
                  {hasSavedAnswers && (
                    <Text
                      style={[
                        styles.savedBadge,
                        { color: colors.success, backgroundColor: colors.successBackground },
                      ]}
                    >
                      Guardado
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
            <Button title="Añadir más estudiantes" onPress={() => setShowImportModal(true)} />
          </>
        )}
      </View>

      {/* Marcas: respuestas del estudiante seleccionado */}
      {selectedStudent && (
        <View style={[styles.studentDetail, { backgroundColor: colors.border }]}>
          <View style={styles.studentFields}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Código del estudiante
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.background,
                  color: colors.textStrong,
                },
              ]}
              value={studentCode}
              onChangeText={setStudentCode}
              autoCapitalize="characters"
              placeholder="Ej: E001"
              placeholderTextColor={colors.textWeak}
              accessibilityLabel="Código del estudiante"
            />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Nombre del estudiante
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.background,
                  color: colors.textStrong,
                },
              ]}
              value={studentName}
              onChangeText={setStudentName}
              autoCapitalize="words"
              placeholder="Ej: Estudiante 1"
              placeholderTextColor={colors.textWeak}
              accessibilityLabel="Nombre del estudiante"
            />
          </View>
          <View style={[styles.scoreCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Nota:</Text>
            <Text style={[styles.scoreValue, { color: colors.success }]}>
              {liveScore !== null
                ? `${liveScore} / ${evaluationMeta?.maxScore ?? '—'}`
                : '— (falta clave de respuestas)'}
            </Text>
          </View>
        </View>
      )}

      {/* Marcar respuestas */}
      {selectedStudent && (
        <View style={styles.answersSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Respuestas del estudiante
          </Text>
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((questionNumber) => {
            const currentAnswer = studentAnswers[questionNumber - 1] ?? '';
            const isMissing = currentAnswer === '';
            return (
              <View key={questionNumber} style={styles.answerRow}>
                <Text
                  style={[
                    styles.questionLabel,
                    { color: isMissing ? colors.warning : colors.textSecondary },
                  ]}
                >
                  Pregunta {questionNumber}
                  {isMissing ? ' — sin marcar' : ''}
                </Text>
                <View style={styles.answerOptions}>
                  {(['A', 'B', 'C', 'D'] as const).map((option) => {
                    const selected = option === currentAnswer;
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
                        accessibilityLabel={`Pregunta ${questionNumber}, opción ${option}`}
                        accessibilityState={{ selected }}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        onPress={() => {
                          const newAnswers = [...studentAnswers];
                          newAnswers[questionNumber - 1] =
                            option === currentAnswer ? '' : option;
                          setStudentAnswers(newAnswers);
                        }}
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
            );
          })}
        </View>
      )}

      {/* Escaneo por IA: botón junto al marcado manual (RF-15) */}
      {selectedStudent && (
        <TouchableOpacity
          style={[
            styles.scanButton,
            { borderColor: colors.borderStrong, backgroundColor: colors.background },
          ]}
          onPress={() => setShowScanModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Escanear hoja de respuestas"
        >
          <Text style={[styles.scanButtonText, { color: colors.textStrong }]}>
            Escanear hoja de respuestas
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.success }]}
        onPress={handleSaveAnswers}
        accessibilityRole="button"
        accessibilityLabel="Guardar respuestas"
      >
        <Text style={styles.saveButtonText}>Guardar respuestas</Text>
      </TouchableOpacity>

      {selectedStudent && evaluationMeta && showScanModal && (
        <ScanAnswerSheetModal
          onClose={() => setShowScanModal(false)}
          evaluationId={evaluationId}
          studentId={selectedStudent}
          totalQuestions={totalQuestions}
          evaluationMeta={evaluationMeta as ScanEvaluationMeta}
          onSaved={handleScanSaved}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalContainer: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  studentsSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  studentRowSelected: {
    borderWidth: 2,
  },
  studentRowText: {
    fontSize: 15,
  },
  studentRowTextSelected: {
    fontWeight: '600',
  },
  studentRow: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedBadge: {
    fontSize: 12,
    fontWeight: '600',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    overflow: 'hidden',
    marginLeft: 8,
  },
  studentDetail: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 6,
  },
  studentFields: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 4,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  scoreLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  answersSection: {
    marginTop: 20,
  },
  answerRow: {
    marginBottom: 10,
  },
  questionLabel: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
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
  saveButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  scanButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

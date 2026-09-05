import * as React from "react"
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, StyleSheet, Button } from "react-native"
import * as Database from "@/database"
import { importStudentsFromCSV } from "@/lib/importStudents"
import { calculateScore } from "@/lib/calculateScore"

interface StudentRecord {
  id: string
  code: string
  name: string
  answers?: string
}

interface EvaluationMeta {
  gradingSystem: "0-to-max" | "1-to-max"
  maxScore: number
  weights: number[]
  correctAnswers: string[]
}

interface StudentAnswersProps {
  evaluationId: string
  totalQuestions: number
  onSave: (student: {
    id: string
    code: string
    name: string
    answers: string[]
  }) => void
}

export const StudentAnswers: React.FC<StudentAnswersProps> = ({
  evaluationId,
  totalQuestions,
  onSave,
}) => {
  const [students, setStudents] = React.useState<StudentRecord[]>([])
  const [selectedStudent, setSelectedStudent] = React.useState<string | null>(null)
  const [studentAnswers, setStudentAnswers] = React.useState<string[]>([])
  const [evaluationMeta, setEvaluationMeta] = React.useState<EvaluationMeta | null>(null)
  const [showImportModal, setShowImportModal] = React.useState(false)
  const [newStudentCode, setNewStudentCode] = React.useState("")
  const [newStudentName, setNewStudentName] = React.useState("")

  const selectedStudentRecord = students.find((s) => s.id === selectedStudent) || null

  // Cargar estudiantes de esta evaluación
  const loadStudents = async () => {
    try {
      const records = await Database.selectStudentsByEvaluation(evaluationId)
      setStudents(records as StudentRecord[])
      if (records.length === 0) {
        setSelectedStudent(null)
        setShowImportModal(true)
        return
      }
      setSelectedStudent(records[0].id)
      const firstAnswers = JSON.parse(String((records[0] as any).answers || "[]")) as string[]
      setStudentAnswers(
        firstAnswers.length === totalQuestions ? firstAnswers : new Array(totalQuestions).fill("A"),
      )
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los estudiantes: " + (error as Error).message)
    }
  }

  // Cargar metadatos de la evaluación (sistema, nota máxima, pesos y clave)
  React.useEffect(() => {
    let active = true
    Database.selectEvaluation(evaluationId)
      .then((evaluation) => {
        if (!active || !evaluation) return
        setEvaluationMeta({
          gradingSystem: String(evaluation.gradingSystem) as "0-to-max" | "1-to-max",
          maxScore: Number(evaluation.maxScore),
          weights: JSON.parse(String(evaluation.questionWeights || "[]")) as number[],
          correctAnswers: JSON.parse(String(evaluation.correctAnswers || "[]")) as string[],
        })
      })
      .catch(() => {
        if (active) {
          setEvaluationMeta(null)
        }
      })
    return () => {
      active = false
    }
  }, [evaluationId])

  // Cargar estudiantes de esta evaluación al montar
  React.useEffect(() => {
    let active = true
    Database.selectStudentsByEvaluation(evaluationId)
      .then((records) => {
        if (!active) return
        setStudents(records as StudentRecord[])
        if (records.length === 0) {
          setSelectedStudent(null)
          setShowImportModal(true)
          return
        }
        setSelectedStudent(records[0].id)
        const firstAnswers = JSON.parse(String((records[0] as any).answers || "[]")) as string[]
        setStudentAnswers(
          firstAnswers.length === totalQuestions
            ? firstAnswers
            : new Array(totalQuestions).fill("A"),
        )
      })
      .catch((error) => {
        if (active) {
          Alert.alert("Error", "No se pudieron cargar los estudiantes: " + (error as Error).message)
        }
      })
    return () => {
      active = false
    }
  }, [evaluationId])

  const selectStudent = (studentId: string) => {
    const record = students.find((s) => s.id === studentId)
    if (!record) return
    setSelectedStudent(studentId)
    const existingAnswers = JSON.parse(String((record as any).answers || "[]")) as string[]
    setStudentAnswers(
      existingAnswers.length === totalQuestions
        ? existingAnswers
        : new Array(totalQuestions).fill("A"),
    )
  }

  const liveScore = React.useMemo(() => {
    if (!evaluationMeta || evaluationMeta.correctAnswers.length !== totalQuestions) return null
    const correctAnswers = evaluationMeta.correctAnswers
    const correctPerQuestion = Array.from({ length: totalQuestions }, (_, i) =>
      studentAnswers[i] === correctAnswers[i],
    )
    const correct = correctPerQuestion.filter(Boolean).length
    const useWeights =
      evaluationMeta.weights.length === totalQuestions ? evaluationMeta.weights : null
    return calculateScore({
      system: evaluationMeta.gradingSystem,
      maxScore: evaluationMeta.maxScore,
      totalQuestions,
      correct,
      correctPerQuestion,
      weights: useWeights,
    }).score
  }, [evaluationMeta, studentAnswers, totalQuestions])

  // Crear un estudiante individual
  const handleCreateStudent = async () => {
    const code = newStudentCode.trim()
    const name = newStudentName.trim()
    if (!code) {
      Alert.alert("Error", "Ingrese el código del estudiante")
      return
    }
    try {
      const id = Math.random().toString(36).substr(2, 9)
      await Database.insertStudent({
        id,
        evaluationId,
        code,
        name,
        photoPath: null,
        answers: [],
      })
      setNewStudentCode("")
      setNewStudentName("")
      setShowImportModal(false)
      await loadStudents()
      selectStudent(id)
    } catch (error) {
      Alert.alert("Error", "No se pudo crear el estudiante: " + (error as Error).message)
    }
  }

  // Importar estudiantes desde CSV
  const handleImportStudents = async (csvString: string) => {
    try {
      const students = importStudentsFromCSV(csvString)
      if (students.length > 0) {
        // Guardar los primeros estudiantes en la base de datos
        for (const student of students) {
          await Database.insertStudent({
            id: student.id,
            evaluationId: evaluationId,
            code: student.code,
            name: student.name,
            photoPath: null,
            answers: [], // Se llenará después
          })
        }
        await loadStudents()
        setShowImportModal(false)
        setNewStudentCode("")
        setNewStudentName("")
      }
    } catch (error) {
      Alert.alert("Error de CSV", "No se pudo importar el CSV: " + (error as Error).message)
    }
  }

  // Guardar respuestas del estudiante seleccionado
  const handleSaveAnswers = async () => {
    if (!selectedStudent) {
      Alert.alert("Error", "Seleccione un estudiante primero")
      return
    }
    if (studentAnswers.length === 0) {
      Alert.alert("Error", "Marque al menos una respuesta")
      return
    }
    try {
      const evaluation = await Database.selectEvaluation(evaluationId)
      if (!evaluation) {
        Alert.alert("Error", "No se encontró la evaluación")
        return
      }
      const gradingSystem = String(evaluation.gradingSystem) as "0-to-max" | "1-to-max"
      const maxScore = Number(evaluation.maxScore)
      const weights = JSON.parse(String(evaluation.questionWeights || "[]")) as number[]
      const useWeights = weights.length === totalQuestions ? weights : null

      // Comparar con la clave de respuestas de la evaluación
      const correctAnswers = JSON.parse(String(evaluation.correctAnswers || "[]")) as string[]
      const hasKey = correctAnswers.length === totalQuestions
      let score = 0
      if (hasKey) {
        const correctPerQuestion = Array.from({ length: totalQuestions }, (_, i) =>
          studentAnswers[i] === correctAnswers[i],
        )
        const correct = correctPerQuestion.filter(Boolean).length
        score = calculateScore({
          system: gradingSystem,
          maxScore,
          totalQuestions,
          correct,
          correctPerQuestion,
          weights: useWeights,
        }).score
      }

      await Database.updateStudentAnswers(selectedStudent, studentAnswers, score)

      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent ? { ...s, answers: JSON.stringify(studentAnswers) } : s,
        ),
      )

      const student = {
        id: selectedStudent,
        code: "",
        name: "",
        answers: studentAnswers,
      }
      onSave(student)
      Alert.alert("Éxito", "Respuestas y nota guardadas correctamente")
    } catch (error) {
      Alert.alert("Error", "No se pudieron guardar las respuestas: " + (error as Error).message)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seleccionar Estudiante y Respuestas</Text>

      {/* Sección: Importar estudiantes */}
      {showImportModal && (
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Importar estudiantes</Text>
          <TextInput
            style={styles.input}
            placeholder="Código, nombre (uno por línea o CSV)"
            value={newStudentCode}
            onChangeText={setNewStudentCode}
            multiline
            numberOfLines={3}
          />
          <TextInput
            style={styles.input}
            placeholder="Nombre del estudiante"
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
        <Text style={styles.sectionTitle}>Estudiantes en esta evaluación</Text>
        {students.length === 0 ? (
          <Button title="Añadir nuevo estudiante" onPress={() => setShowImportModal(true)} />
        ) : (
          <>
            {students.map((student) => {
              const isSelected = student.id === selectedStudent
              const hasSavedAnswers = (student.answers || "[]") !== "[]"
              return (
                <TouchableOpacity
                  key={student.id}
                  style={[styles.studentRow, isSelected && styles.studentRowSelected]}
                  onPress={() => selectStudent(student.id)}
                >
                  <Text
                    style={[styles.studentRowText, isSelected && styles.studentRowTextSelected]}
                  >
                    {student.code ? `${student.code} — ${student.name || "Sin nombre"}` : student.name}
                  </Text>
                  {hasSavedAnswers && <Text style={styles.savedBadge}>Guardado</Text>}
                </TouchableOpacity>
              )
            })}
            <Button title="Añadir más estudiantes" onPress={() => setShowImportModal(true)} />
          </>
        )}
      </View>

      {/* Marcas: respuestas del estudiante seleccionado */}
      {selectedStudent && (
        <View style={styles.studentDetail}>
          <Text style={styles.studentName}>
            {selectedStudentRecord
              ? selectedStudentRecord.code
                ? `${selectedStudentRecord.code} — ${selectedStudentRecord.name || "Sin nombre"}`
                : selectedStudentRecord.name
              : "Estudiante seleccionado"}
          </Text>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Nota:</Text>
            <Text style={styles.scoreValue}>
              {liveScore !== null
                ? `${liveScore} / ${evaluationMeta?.maxScore ?? "—"}`
                : "— (falta clave de respuestas)"}
            </Text>
          </View>
        </View>
      )}

      {/* Marcar respuestas */}
      {selectedStudent && (
        <View style={styles.answersSection}>
          <Text style={styles.sectionTitle}>Respuestas del estudiante</Text>
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((questionNumber) => {
            const currentAnswer = studentAnswers[questionNumber - 1] || "A"
            return (
              <View key={questionNumber} style={styles.answerRow}>
                <Text style={styles.questionLabel}>Pregunta {questionNumber}:</Text>
                <View style={styles.answerOptions}>
                  {(["A", "B", "C", "D"] as const).map((option) => {
                    const selected = option === currentAnswer
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.answerOption, selected && styles.answerOptionSelected]}
                        onPress={() => {
                          const newAnswers = [...studentAnswers]
                          newAnswers[questionNumber - 1] = option
                          setStudentAnswers(newAnswers)
                        }}
                      >
                        <Text
                          style={[
                            styles.answerOptionText,
                            selected && styles.answerOptionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            )
          })}
        </View>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveAnswers}>
        <Text style={styles.saveButtonText}>Guardar respuestas</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2d3748",
  },
  modalContainer: {
    padding: 20,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 8,
    backgroundColor: "white",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
    color: "#2d3748",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: "white",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  studentsSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#4a5568",
  },
  studentRowSelected: {
    borderColor: "#42b983",
    borderWidth: 2,
    backgroundColor: "#e6f7ef",
  },
  studentRowText: {
    fontSize: 15,
    color: "#4a5568",
  },
  studentRowTextSelected: {
    color: "#2a9d6f",
    fontWeight: "600",
  },
  studentRow: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    backgroundColor: "white",
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  savedBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2a9d6f",
    backgroundColor: "#e6f7ef",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    overflow: "hidden",
    marginLeft: 8,
  },
  studentDetail: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 6,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 8,
  },
  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  scoreLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a5568",
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#42b983",
  },
  answersSection: {
    marginTop: 20,
  },
  answerRow: {
    marginBottom: 10,
  },
  questionLabel: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 6,
    fontWeight: "600",
  },
  answerOptions: {
    flexDirection: "row",
  },
  answerOption: {
    width: 40,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  answerOptionSelected: {
    borderColor: "#42b983",
    backgroundColor: "#e6f7ef",
  },
  answerOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a5568",
  },
  answerOptionTextSelected: {
    color: "#2a9d6f",
  },
  saveButton: {
    backgroundColor: "#42b983",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
})
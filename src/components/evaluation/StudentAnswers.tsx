import * as React from "react"
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Picker, Button } from "react-native"
import * as Database from "@/database"
import { useNavigation } from "@react-navigation/native"

interface StudentAnswersProps {
  evaluationId: string
  onSave: (student: {
    id: string
    code: string
    name: string
    answers: string[]
  }) => void
}

export const StudentAnswers: React.FC<StudentAnswersProps> = ({
  evaluationId,
  onSave,
}) => {
  const navigation = useNavigation()
  const [selectedStudent, setSelectedStudent] = React.useState<string | null>(null)
  const [studentAnswers, setStudentAnswers] = React.useState<string[]>([])
  const [showImportModal, setShowImportModal] = React.useState(false)
  const [newStudentCode, setNewStudentCode] = React.useState("")
  const [newStudentName, setNewStudentName] = React.useState("")

  // Cargar estudiantes de esta evaluación
  const loadStudents = async () => {
    try {
      const students = await Database.selectStudentsByEvaluation(evaluationId)
      // Si no hay estudiantes, permitimos agregar uno nuevo
      if (students.length === 0) {
        setShowImportModal(true)
        return
      }
      // Cargar el primer estudiante por defecto
      setSelectedStudent(students[0].id)
      setStudentAnswers(new Array(10).fill("A")) // 10 preguntas por defecto, se actualizará después
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los estudiantes: " + (error as Error).message)
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
        loadStudents()
        setShowImportModal(false)
        setNewStudentCode("")
        setNewStudentName("")
      }
    } catch (error) {
      Alert.alert("Error de CSV", "No se pudo importar el CSV: " + (error as Error).message)
    }
  }

  // Guardar respuestas del estudiante seleccionado
  const handleSaveAnswers = () => {
    if (!selectedStudent) {
      Alert.alert("Error", "Seleccione un estudiante primero")
      return
    }
    if (studentAnswers.length === 0) {
      Alert.alert("Error", "Marque al menos una respuesta")
      return
    }
    const student = {
      id: selectedStudent,
      code: "", // Se llenará después
      name: "", // Se llenará después
      answers: studentAnswers,
    }
    onSave(student)
    navigation.goBack()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title>Seleccionar Estudiante y Respuestas</Text>

      {/* Sección: Importar estudiantes */}
      {showImportModal && (
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle>Importar estudiantes</Text>
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
            <Button title="Crear estudiante" onPress={() => setShowImportModal(false)} />
          </View>
        </View>
      )}

      {/* Sección: Estudiantes existentes */}
      <View style={styles.studentsSection}>
        <Text style={styles.sectionTitle>Estudiantes en esta evaluación</Text>
        {selectedStudent ? null : (
          <Button title="Añadir nuevo estudiante" onPress={() => setShowImportModal(true)} />
        )}
      </View>

      {/* Seleccionar estudiante */}
      {selectedStudent && (
        <View style={styles.studentDetail}>
          <Text style={styles.studentName}>Estudiante seleccionado</Text>
          <Button title="Cambiar estudiante" onPress={() => setSelectedStudent(null)} />
        </View>
      )}

      {/* Marcar respuestas */}
      {selectedStudent && (
        <View style={styles.answersSection}>
          <Text style={styles.sectionTitle>Respuestas del estudiante</Text>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((questionNumber) => (
            <Picker
              key={questionNumber}
              selectedValue={studentAnswers[questionNumber - 1] || "A"}
              onValueChange={(newValue: string) => {
                const newAnswers = [...studentAnswers]
                newAnswers[questionNumber - 1] = newValue
                setStudentAnswers(newAnswers)
              }}
              style={styles.picker}
            >
              <Picker.Item label="A" value="A" />
              <Picker.Item label="B" value="B" />
              <Picker.Item label="C" value="C" />
              <Picker.Item label="D" value="D" />
            </Picker>
          ))}
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
  studentDetail: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 6,
  },
  answersSection: {
    marginTop: 20,
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
  picker: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: "white",
    minHeight: 50,
  },
})
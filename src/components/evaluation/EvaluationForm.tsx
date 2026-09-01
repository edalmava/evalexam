import * as React from "react"
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, StyleSheet, Switch } from "react-native"
import { Picker } from "@expo/ui/community/picker"
import * as Database from "../../database"

interface EvaluationFormProps {
  initialEvaluation?: {
    id?: string
    name?: string
    date?: string
    academicPeriod?: string
    totalQuestions?: number
    totalStudents?: number
    questionWeights?: number[]
    gradingSystem?: "0-to-max" | "1-to-max"
    maxScore?: number
  }
  onSave: (evaluation: {
    id: string
    name: string
    date: string
    academicPeriod: string
    totalQuestions: number
    totalStudents: number
    questionWeights: number[]
    gradingSystem: "0-to-max" | "1-to-max"
    maxScore: number
  }) => void
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  initialEvaluation,
  onSave,
}) => {
  const [name, setName] = React.useState(initialEvaluation?.name || "")
  const [date, setDate] = React.useState(initialEvaluation?.date || new Date().toISOString().split("T")[0])
  const [academicPeriod, setAcademicPeriod] = React.useState<
    string
  >(initialEvaluation?.academicPeriod || "Primer Semestre")
  const [totalQuestions, setTotalQuestions] = React.useState<number>(
    initialEvaluation?.totalQuestions || 10,
  )
  const [totalStudents, setTotalStudents] = React.useState<number>(
    initialEvaluation?.totalStudents || 1,
  )
  const [questionWeights, setQuestionWeights] = React.useState<number[]>(
    initialEvaluation?.questionWeights || [1],
  )
  const [gradingSystem, setGradingSystem] = React.useState<
    "0-to-max" | "1-to-max"
  >(initialEvaluation?.gradingSystem || "0-to-max")
  const [maxScore, setMaxScore] = React.useState<number>(
    initialEvaluation?.maxScore || 5,
  )

  const periods: { label: string; value: string }[] = [
    "Primer Semestre",
    "Segundo Semestre",
    "Primer Cuatrimestre",
    "Segundo Cuatrimestre",
  ]

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre de la prueba es obligatorio")
      return
    }
    if (totalQuestions <= 0) {
      Alert.alert("Error", "El número de preguntas debe ser mayor a 0")
      return
    }
    if (totalStudents <= 0) {
      Alert.alert("Error", "El número de estudiantes debe ser mayor a 0")
      return
    }
    if (maxScore <= 0) {
      Alert.alert("Error", "La nota máxima debe ser mayor a 0")
      return
    }

    const weights = questionWeights.length === 1 ? new Array(totalQuestions).fill(questionWeights[0]) : questionWeights
    if (weights.length !== totalQuestions) {
      Alert.alert(
        "Error",
        `El número de pesos (${weights.length}) debe coincidir con el número de preguntas (${totalQuestions})`,
      )
      return
    }

    const evaluation = {
      id: initialEvaluation?.id || Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      date,
      academicPeriod,
      totalQuestions,
      totalStudents,
      questionWeights: weights,
      gradingSystem,
      maxScore,
    }

    try {
      await Database.insertEvaluation(
        evaluation.id,
        evaluation.name,
        evaluation.date,
        evaluation.academicPeriod,
        evaluation.totalQuestions,
        evaluation.gradingSystem,
        evaluation.maxScore,
        evaluation.questionWeights,
      )
      onSave(evaluation)
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la evaluación: " + (error as Error).message)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Crear Evaluación</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre de la prueba</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(text) => setName(text)}
          placeholder="Ej: Matemáticas Basicas"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Fecha de la prueba</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={(text) => setDate(text)}
          placeholder="AAAA-MM-DD"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Período académico</Text>
        <Picker
          selectedValue={academicPeriod}
          onValueChange={(itemValue: string) => setAcademicPeriod(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Primer Semestre" value="Primer Semestre" />
          <Picker.Item label="Segundo Semestre" value="Segundo Semestre" />
          <Picker.Item label="Primer Cuatrimestre" value="Primer Cuatrimestre" />
          <Picker.Item label="Segundo Cuatrimestre" value="Segundo Cuatrimestre" />
        </Picker>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Número de preguntas</Text>
        <TextInput
          style={styles.input}
          value={totalQuestions.toString()}
          onChangeText={(text) => setTotalQuestions(parseInt(text, 10))}
          keyboardType="numeric"
          placeholder="Ej: 40"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Número de estudiantes</Text>
        <TextInput
          style={styles.input}
          value={totalStudents.toString()}
          onChangeText={(text) => setTotalStudents(parseInt(text, 10))}
          keyboardType="numeric"
          placeholder="Ej: 30"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Peso de preguntas</Text>
        <Text style={styles.subLabel}>
          Igual peso para todas:{" "}
          <Switch
            value={questionWeights.length === 1 && questionWeights[0] === 1}
            onValueChange={(newValue: boolean) => {
              if (newValue) {
                setQuestionWeights([1])
              }
            }}
          />{" "}
          Diferente por pregunta:{" "}
          <Switch
            value={questionWeights.length > 1}
            onValueChange={(newValue: boolean) => {
              if (newValue) {
                setQuestionWeights(Array.from({ length: totalQuestions }, (_, i) => i + 1))
              }
            }}
          />
        </Text>
      </View>

      {questionWeights.length > 1 && (
        <View style={styles.weightsContainer}>
          <Text style={styles.subLabel}>Asignar peso por pregunta:</Text>
          {questionWeights.map((weight, index) => (
            <View key={index} style={styles.weightRow}>
              <Text style={styles.weightLabel}>Pregunta {index + 1}:</Text>
              <TextInput
                style={styles.weightInput}
                value={weight.toString()}
                onChangeText={(text) => {
                  const newWeights = [...questionWeights]
                  newWeights[index] = parseInt(text, 10) || 1
                  setQuestionWeights(newWeights)
                }}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          ))}
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sistema de calificación</Text>
        <Picker
          selectedValue={gradingSystem}
          onValueChange={(itemValue: string) => setGradingSystem(itemValue as "0-to-max" | "1-to-max")}
          style={styles.picker}
        >
          <Picker.Item label="Sistema 0 a nota máxima" value="0-to-max" />
          <Picker.Item label="Sistema 1 a nota máxima" value="1-to-max" />
        </Picker>
        <Text style={styles.hint}>Nota máxima configurable (ej. 5, 10, 20, 100)</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nota máxima</Text>
        <TextInput
          style={styles.input}
          value={maxScore.toString()}
          onChangeText={(text) => setMaxScore(parseInt(text, 10) || 5)}
          keyboardType="numeric"
          placeholder="Ej: 5"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Guardar Evaluación</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2d3748",
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#4a5568",
  },
  subLabel: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 3,
  },
  hint: {
    fontSize: 12,
    color: "#718096",
    marginTop: 3,
  },
  picker: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: "white",
    marginTop: 5,
    marginBottom: 15,
  },
  weightsContainer: {
    marginBottom: 15,
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  weightLabel: {
    flex: 1,
    fontSize: 14,
    color: "#4a5568",
    marginRight: 10,
  },
  weightInput: {
    width: 50,
    height: 30,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 4,
    paddingHorizontal: 5,
    textAlign: "center",
    fontSize: 14,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 16,
    marginTop: 5,
    marginBottom: 10,
    backgroundColor: "white",
  },
  saveButton: {
    backgroundColor: "#42b983",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
})
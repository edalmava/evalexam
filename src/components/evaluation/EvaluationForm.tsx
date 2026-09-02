import * as React from "react"
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native"
import * as Database from "../../database"
import { validateWeights, getDefaultWeight } from "../../lib/weightValidation"

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
    weightMode?: "equal" | "different"
  }
  initialWeightMode?: "equal" | "different"
  persist?: boolean
  submitLabel?: string
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
    weightMode: "equal" | "different"
  }) => void
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  initialEvaluation,
  initialWeightMode,
  persist = true,
  submitLabel = "Guardar Evaluación",
  onSave,
}) => {
  const [name, setName] = React.useState(initialEvaluation?.name || "")
  const [date, setDate] = React.useState(initialEvaluation?.date || new Date().toISOString().split("T")[0])
  const [academicPeriod, setAcademicPeriod] = React.useState<
    string
  >(initialEvaluation?.academicPeriod || "Primer Período")
  const [totalQuestionsText, setTotalQuestionsText] = React.useState<string>(
    initialEvaluation?.totalQuestions?.toString() || "10",
  )
  const [totalStudentsText, setTotalStudentsText] = React.useState<string>(
    initialEvaluation?.totalStudents?.toString() || "1",
  )
  const [questionWeights, setQuestionWeights] = React.useState<number[]>(
    initialEvaluation?.questionWeights || [1],
  )
  const [weightMode, setWeightMode] = React.useState<"equal" | "different">(
    initialWeightMode ||
      initialEvaluation?.weightMode ||
      (initialEvaluation?.questionWeights && initialEvaluation.questionWeights.length > 1
        ? "different"
        : "equal"),
  )
  const [gradingSystem, setGradingSystem] = React.useState<
    "0-to-max" | "1-to-max"
  >(initialEvaluation?.gradingSystem || "0-to-max")
  const [maxScoreText, setMaxScoreText] = React.useState<string>(
    initialEvaluation?.maxScore?.toString() || "5",
  )

  const totalQuestions = parseInt(totalQuestionsText, 10) || 0
  const totalStudents = parseInt(totalStudentsText, 10) || 0
  const maxScore = parseInt(maxScoreText, 10) || 0

  const periods: string[] = [
    "Primer Período",
    "Segundo Período",
    "Tercer Período",
    "Cuarto Período",
  ]

  const gradingSystems: { label: string; value: "0-to-max" | "1-to-max" }[] = [
    { label: "Sistema 0 a nota máxima", value: "0-to-max" },
    { label: "Sistema 1 a nota máxima", value: "1-to-max" },
  ]

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre de la prueba es obligatorio")
      return
    }
    if (!totalQuestions || totalQuestions <= 0) {
      Alert.alert("Error", "El número de preguntas debe ser un número mayor a 0")
      return
    }
    if (!totalStudents || totalStudents <= 0) {
      Alert.alert("Error", "El número de estudiantes debe ser un número mayor a 0")
      return
    }
    if (!maxScore || maxScore <= 0) {
      Alert.alert("Error", "La nota máxima debe ser un número mayor a 0")
      return
    }

    const weights = weightMode === "equal"
      ? new Array(totalQuestions).fill(questionWeights[0] || 1)
      : questionWeights
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
      weightMode,
    }

    try {
      if (persist) {
        if (initialEvaluation?.id) {
          await Database.updateEvaluation(
            evaluation.id,
            evaluation.name,
            evaluation.date,
            evaluation.academicPeriod,
            evaluation.totalQuestions,
            evaluation.gradingSystem,
            evaluation.maxScore,
            evaluation.questionWeights,
          )
        } else {
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
        }
      }
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
        {periods.map((period) => {
          const selected = period === academicPeriod
          return (
            <TouchableOpacity
              key={period}
              style={[styles.optionRow, selected && styles.optionRowSelected]}
              onPress={() => setAcademicPeriod(period)}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {period}
              </Text>
              <Text style={[styles.optionCheck, selected && styles.optionCheckVisible]}>
                {selected ? "✓" : "○"}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Número de preguntas</Text>
        <TextInput
          style={styles.input}
          value={totalQuestionsText}
          onChangeText={setTotalQuestionsText}
          keyboardType="numeric"
          placeholder="Ej: 40"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Número de estudiantes</Text>
        <TextInput
          style={styles.input}
          value={totalStudentsText}
          onChangeText={setTotalStudentsText}
          keyboardType="numeric"
          placeholder="Ej: 30"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sistema de calificación</Text>
        {gradingSystems.map(({ label, value }) => {
          const selected = value === gradingSystem
          return (
            <TouchableOpacity
              key={value}
              style={[styles.optionRow, selected && styles.optionRowSelected]}
              onPress={() => setGradingSystem(value)}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {label}
              </Text>
              <Text style={[styles.optionCheck, selected && styles.optionCheckVisible]}>
                {selected ? "✓" : "○"}
              </Text>
            </TouchableOpacity>
          )
        })}
        <Text style={styles.hint}>Nota máxima configurable (ej. 5, 10, 20, 100)</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Peso de preguntas</Text>
        <TouchableOpacity
          style={[styles.optionRow, weightMode === "equal" && styles.optionRowSelected]}
          onPress={() => {
            setWeightMode("equal")
            setQuestionWeights([1])
          }}
        >
          <Text style={[styles.optionText, weightMode === "equal" && styles.optionTextSelected]}>
            Igual peso para todas
          </Text>
          <Text style={[styles.optionCheck, weightMode === "equal" && styles.optionCheckVisible]}>
            {weightMode === "equal" ? "✓" : "○"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionRow, weightMode === "different" && styles.optionRowSelected]}
          onPress={() => {
            const baseWeight = getDefaultWeight(gradingSystem, maxScore, totalQuestions)
            setWeightMode("different")
            setQuestionWeights(
              Array.from({ length: totalQuestions > 0 ? totalQuestions : 10 }, () =>
                baseWeight > 0 ? baseWeight : 1,
              ),
            )
          }}
        >
          <Text style={[styles.optionText, weightMode === "different" && styles.optionTextSelected]}>
            Diferente por pregunta
          </Text>
          <Text style={[styles.optionCheck, weightMode === "different" && styles.optionCheckVisible]}>
            {weightMode === "different" ? "✓" : "○"}
          </Text>
        </TouchableOpacity>
      </View>

      {weightMode === "different" && (
        <View style={styles.weightsContainer}>
          <Text style={styles.subLabel}>Asignar peso por pregunta:</Text>
          {questionWeights.map((weight, index) => (
            <View key={index} style={styles.weightRow}>
              <Text style={styles.weightLabel}>Pregunta {index + 1}:</Text>
              <TextInput
                style={styles.weightInput}
                value={weight.toString()}
                onChangeText={(text) => {
                  const newWeight = parseFloat(text)
                  const newWeights = [...questionWeights]
                  newWeights[index] = Number.isFinite(newWeight) && newWeight > 0 ? newWeight : 1
                  setQuestionWeights(newWeights)
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
                validateWeights(questionWeights, gradingSystem, maxScore).exceeds
                  ? styles.weightValidationError
                  : styles.weightValidationOk,
              ]}
            >
              Peso total: {validateWeights(questionWeights, gradingSystem, maxScore).totalWeight} de{" "}
              {validateWeights(questionWeights, gradingSystem, maxScore).limit} permitido
            </Text>
          )}
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nota máxima</Text>
        <TextInput
          style={styles.input}
          value={maxScoreText}
          onChangeText={setMaxScoreText}
          keyboardType="numeric"
          placeholder="Ej: 5"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{submitLabel}</Text>
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
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    backgroundColor: "white",
    marginBottom: 6,
  },
  optionRowSelected: {
    borderColor: "#42b983",
    borderWidth: 2,
    backgroundColor: "#e6f7ef",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: "#4a5568",
  },
  optionTextSelected: {
    color: "#2a9d6f",
    fontWeight: "600",
  },
  optionCheck: {
    fontSize: 16,
    color: "#cbd5e0",
    marginLeft: 8,
  },
  optionCheckVisible: {
    color: "#42b983",
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
    width: 58,
    height: 34,
    minWidth: 58,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 0,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 16,
    color: "#2d3748",
    backgroundColor: "white",
  },
  weightValidation: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  weightValidationOk: {
    color: "#2a9d6f",
  },
  weightValidationError: {
    color: "#e53e3e",
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
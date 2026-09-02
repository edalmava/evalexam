import * as React from "react"
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native"
import { validateWeights, getDefaultWeight } from "@/lib/weightValidation"

interface AnswerKeyProps {
  totalQuestions: number
  onSave: (key: AnswerKeyData) => void
  initialWeights?: number[]
  initialGradingSystem?: "0-to-max" | "1-to-max"
  initialMaxScore?: number
  initialCorrectAnswers?: string[]
  initialWeightMode?: "equal" | "different"
  onChange?: (key: AnswerKeyData, weightMode: "equal" | "different") => void
  submitLabel?: string
}

export interface AnswerKeyData {
  correctAnswers: string[]  // Array de respuestas correctas (A, B, C, D) por pregunta
  weights: number[]  // Pesos de cada pregunta
  maxScore: number
  gradingSystem: "0-to-max" | "1-to-max"
}

export interface AnswerKeyFormState {
  correctAnswers: string[]
  currentWeight: number
  weights: number[]
  weightMode: "equal" | "different"
  gradingSystem: "0-to-max" | "1-to-max"
  maxScore: number
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
  submitLabel = "Guardar Clave de Respuestas",
}) => {
  const [state, setState] = React.useState<AnswerKeyFormState>(() => {
    const hasPerQuestionWeights = initialWeights ? initialWeights.length > 1 : totalQuestions > 1
    const defaultWeights = initialWeights
      ? initialWeights
      : totalQuestions === 1
        ? [1]
        : new Array(totalQuestions).fill(1)

    return {
      correctAnswers:
        initialCorrectAnswers && initialCorrectAnswers.length === totalQuestions
          ? [...initialCorrectAnswers]
          : new Array(totalQuestions).fill("A"),
      currentWeight: 1,
      weights: [...defaultWeights],
      weightMode: initialWeightMode || (hasPerQuestionWeights ? "different" : "equal"),
      gradingSystem: initialGradingSystem || "0-to-max",
      maxScore: initialMaxScore || 5,
    }
  })

  const buildKeyData = React.useCallback((): AnswerKeyData => {
    return {
      correctAnswers: state.correctAnswers,
      weights:
        state.weightMode === "equal"
          ? new Array(Math.max(totalQuestions, 1)).fill(state.weights[0] || 1)
          : state.weights,
      maxScore: state.maxScore,
      gradingSystem: state.gradingSystem,
    }
  }, [state, totalQuestions])

  React.useEffect(() => {
    onChange?.(buildKeyData(), state.weightMode)
  }, [buildKeyData, onChange, state.weightMode])

  const handleSave = () => {
    try {
      onSave(buildKeyData())
      Alert.alert("Éxito", "Clave de respuestas guardada correctamente")
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la clave: " + (error as Error).message)
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={styles.scrollViewStyle}
    >
      <Text style={styles.title}>Clave de Respuestas</Text>

      {/* Sistema de calificación */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Sistema de calificación</Text>
        {(["0-to-max", "1-to-max"] as const).map((value) => {
          const label = value === "0-to-max" ? "Sistema 0 a nota máxima" : "Sistema 1 a nota máxima"
          const selected = value === state.gradingSystem
          return (
            <TouchableOpacity
              key={value}
              style={[styles.optionRow, selected && styles.optionRowSelected]}
              onPress={() => setState({ ...state, gradingSystem: value })}
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
        <Text style={styles.sectionHint}>
          Nota máxima configurable (ej. 5, 10, 20, 100)
        </Text>
      </View>

      {/* Nota máxima */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Nota máxima</Text>
        <TextInput
          style={styles.input}
          value={state.maxScore.toString()}
          onChangeText={(text) => {
            const score = parseInt(text, 10) || 5
            if (score > 0) {
              setState({ ...state, maxScore: score })
            }
          }}
          keyboardType="numeric"
          placeholder="Ej: 5"
          maxLength={3}
        />
      </View>

      {/* Configuración de pesos */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Peso de preguntas</Text>
        <TouchableOpacity
          style={[styles.optionRow, state.weightMode === "equal" && styles.optionRowSelected]}
          onPress={() => setState({ ...state, weightMode: "equal", weights: [1] })}
        >
          <Text style={[styles.optionText, state.weightMode === "equal" && styles.optionTextSelected]}>
            Igual peso para todas
          </Text>
          <Text style={[styles.optionCheck, state.weightMode === "equal" && styles.optionCheckVisible]}>
            {state.weightMode === "equal" ? "✓" : "○"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionRow, state.weightMode === "different" && styles.optionRowSelected]}
          onPress={() => {
            const baseWeight = getDefaultWeight(state.gradingSystem, state.maxScore, totalQuestions)
            setState({
              ...state,
              weightMode: "different",
              weights: Array.from({ length: totalQuestions > 0 ? totalQuestions : 1 }, () =>
                baseWeight > 0 ? baseWeight : 1,
              ),
            })
          }}
        >
          <Text style={[styles.optionText, state.weightMode === "different" && styles.optionTextSelected]}>
            Diferente por pregunta
          </Text>
          <Text style={[styles.optionCheck, state.weightMode === "different" && styles.optionCheckVisible]}>
            {state.weightMode === "different" ? "✓" : "○"}
          </Text>
        </TouchableOpacity>

        {/* Mostrar pesos individuales si son diferentes */}
        {state.weightMode === "different" && (
          <View style={styles.weightsIndividual}>
            <Text style={styles.subLabel}>
              Asignar peso por pregunta (1 a {state.weights.length}):
            </Text>
            {state.weights.map((weight, index) => (
              <View key={index} style={styles.weightRow}>
                <Text style={styles.weightLabel}>Pregunta {index + 1}:</Text>
                <TextInput
                  style={styles.weightInput}
                  value={weight.toString()}
                  onChangeText={(text) => {
                    const newWeight = parseFloat(text)
                    const newWeights = [...state.weights]
                    newWeights[index] = Number.isFinite(newWeight) && newWeight > 0 ? newWeight : 1
                    setState({ ...state, weights: newWeights })
                  }}
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
              </View>
            ))}
            {state.maxScore > 0 && (
              <Text
                style={[
                  styles.weightValidation,
                  validateWeights(state.weights, state.gradingSystem, state.maxScore).exceeds
                    ? styles.weightValidationError
                    : styles.weightValidationOk,
                ]}
              >
                Peso total: {validateWeights(state.weights, state.gradingSystem, state.maxScore).totalWeight} de{" "}
                {validateWeights(state.weights, state.gradingSystem, state.maxScore).limit} permitido
              </Text>
            )}
          </View>
        )}

        {/* Peso único si son iguales */}
        {state.weightMode === "equal" && (
          <View style={styles.weightSingle}>
            <Text style={styles.subLabel}>
              Peso único para todas las preguntas:
            </Text>
            <TextInput
              style={styles.weightInput}
              value={state.weights[0].toString()}
              onChangeText={(text) => {
                const newWeight = parseInt(text, 10) || 1
                setState({ ...state, weights: [newWeight] })
              }}
              keyboardType="numeric"
              maxLength={3}
            />
            <Text style={styles.weightNote}>
              (Todas las preguntas tendrán este mismo peso)
            </Text>
          </View>
        )}
      </View>

      {/* Clave de respuestas - selector por pregunta */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Respuesta correcta por pregunta</Text>
        {state.correctAnswers.map((answer, index) => (
          <View
            key={index}
            style={styles.answerRow}
          >
            <Text style={styles.questionLabel}>Pregunta {index + 1}:</Text>
            <View style={styles.answerOptions}>
              {(["A", "B", "C", "D"] as const).map((option) => {
                const selected = option === answer
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.answerOption, selected && styles.answerOptionSelected]}
                    onPress={() =>
                      setState({
                        ...state,
                        correctAnswers: state.correctAnswers.map((a, i) =>
                          i === index ? option : a,
                        ),
                      })
                    }
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
        ))}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{submitLabel}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

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
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2d3748",
  },
  section: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#4a5568",
  },
  sectionHint: {
    fontSize: 12,
    color: "#718096",
    marginTop: 3,
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
  weightInput: {
    height: 34,
    width: 58,
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
  weightSingle: {
    marginTop: 5,
  },
  weightNote: {
    fontSize: 12,
    color: "#718096",
    marginTop: 3,
  },
  weightsIndividual: {
    marginTop: 5,
  },
  subLabel: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 3,
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  weightLabel: {
    flex: 1,
    fontSize: 12,
    color: "#4a5568",
    marginRight: 8,
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
  questionLabel: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 5,
  },
  answerRow: {
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: "#42b983",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#38a16f",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
})
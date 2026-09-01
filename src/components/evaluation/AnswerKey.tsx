import * as React from "react"
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, StyleSheet, Picker } from "react-native"
import * as Database from "../database"
import { calculateScore } from "@/lib/calculateScore"

interface AnswerKeyProps {
  totalQuestions: number
  onSave: (key: AnswerKeyData) => void
  initialWeights?: number[]
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
  gradingSystem: "0-to-max" | "1-to-max"
  maxScore: number
}

export const AnswerKey: React.FC<AnswerKeyProps> = ({
  totalQuestions,
  onSave,
  initialWeights,
}) => {
  const [state, setState] = React.useState<AnswerKeyFormState>(() => {
    const defaultWeights = initialWeights
      ? initialWeights
      : totalQuestions === 1
        ? [1]
        : new Array(totalQuestions).fill(1)

    return {
      correctAnswers: new Array(totalQuestions).fill("A"),
      currentWeight: 1,
      weights: [...defaultWeights],
      gradingSystem: "0-to-max",
      maxScore: 5,
    }
  })

  const handleSave = () => {
    const keyData: AnswerKeyData = {
      correctAnswers: state.correctAnswers,
      weights: state.weights,
      maxScore: state.maxScore,
      gradingSystem: state.gradingSystem,
    }

    try {
      onSave(keyData)
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
        <Picker
          selectedValue={state.gradingSystem}
          onValueChange={(itemValue: string) =>
            setState({ ...state, gradingSystem: itemValue as "0-to-max" | "1-to-max" })
          }
          style={styles.picker}
        >
          <Picker.Item label="Sistema 0 a nota máxima" value="0-to-max" />
          <Picker.Item label="Sistema 1 a nota máxima" value="1-to-max" />
        </Picker>
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
          maxLength="3"
        />
      </View>

      {/* Configuración de pesos */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Peso de preguntas{" "}
          <Text style={styles.weightToggle}>
            <Text style={styles.weightToggleText}>{state.weights.length === 1 ? "Igual para todas" : "Diferente por pregunta"}</Text>
          </Text>
        </Text>

        {/* Mostrar pesos individuales si son diferentes */}
        {state.weights.length > 1 && (
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
                    const newWeight = parseInt(text, 10) || 1
                    const newWeights = [...state.weights]
                    newWeights[index] = newWeight
                    setState({ ...state, weights: newWeights })
                  }}
                  keyboardType="numeric"
                  maxLength="3"
                />
              </View>
            ))}
          </View>
        )}

        {/* Peso único si son iguales */}
        {state.weights.length === 1 && (
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
              maxLength="3"
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
            <Picker
              selectedValue={answer}
              onValueChange={(itemValue: string) =>
                setState({
                  ...state,
                  correctAnswers: state.correctAnswers.map((a, i) =>
                    i === index ? itemValue : a,
                  ),
                })
              }
              style={styles.picker smaller}
            >
              <Picker.Item label="A" value="A" />
              <Picker.Item label="B" value="B" />
              <Picker.Item label="C" value="C" />
              <Picker.Item label="D" value="D" />
            </Picker>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Guardar Clave de Respuestas</Text>
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
  weightToggle: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 4,
  },
  weightToggleText: {
    fontWeight: "600",
    color: "#2d3748",
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
    height: 30,
    width: 50,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 4,
    paddingHorizontal: 5,
    textAlign: "center",
    fontSize: 14,
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
  picker: {
    height: 40,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 6,
    paddingHorizontal: 8,
    marginTop: 5,
    marginBottom: 10,
    backgroundColor: "white",
    minHeight: 40,
  },
  "picker smaller": {
    height: 30,
    minHeight: 30,
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
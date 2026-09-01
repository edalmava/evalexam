import * as React from "react"
import { View, Text, StyleSheet } from "react-native"
import { EvaluationForm } from "@/components/evaluation/EvaluationForm"
import { useNavigation } from "@react-navigation/native"

export default function EvaluationCreationScreen() {
  const navigation = useNavigation()

  const [evaluation, setEvaluation] = React.useState({
    id: "",
    name: "",
    date: new Date().toISOString().split("T")[0],
    academicPeriod: "Primer Semestre",
    totalQuestions: 10,
    totalStudents: 1,
    questionWeights: [1],
    gradingSystem: "0-to-max",
    maxScore: 5,
  })

  const handleSave = (evaluation: {
    id: string
    name: string
    date: string
    academicPeriod: string
    totalQuestions: number
    totalStudents: number
    questionWeights: number[]
    gradingSystem: "0-to-max" | "1-to-max"
    maxScore: number
  }) => {
    setEvaluation(evaluation)
    Alert.alert("Éxito", "Evaluación guardada correctamente")
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración de Evaluación</Text>
      <EvaluationForm
        initialEvaluation={evaluation}
        onSave={handleSave}
      />
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2d3748",
  },
})
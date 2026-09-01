import * as React from "react"
import { Platform, StyleSheet, Text, View, Alert } from "react-native"
import { useColorScheme } from "react-native"
import { EvaluationForm } from "@/components/evaluation/EvaluationForm"

export default function Index() {
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
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 16,
  },
})
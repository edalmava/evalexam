import * as React from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import { View, StyleSheet, TouchableOpacity, Text, Alert } from "react-native"
import { HistoryScreen } from "@/components/evaluation/HistoryScreen"
import { SummaryScreen } from "@/components/evaluation/SummaryScreen"
import { ExportExamScreen } from "@/components/evaluation/ExportExam"
import * as Database from "@/database"
import { notifyEvaluationsChanged, useEvaluationsVersion } from "@/lib/evaluationsEvents"

export default function HistoryTabScreen() {
  const params = useLocalSearchParams<{ evaluationId?: string }>()
  const router = useRouter()
  const evaluationId = params.evaluationId
  const evaluationsVersion = useEvaluationsVersion()
  const [evaluationName, setEvaluationName] = React.useState<string | undefined>()

  React.useEffect(() => {
    let active = true
    if (evaluationId) {
      Database.selectEvaluation(evaluationId)
        .then((ev) => {
          if (!active) return
          if (ev) {
            setEvaluationName(ev.name as string)
          } else {
            router.replace("/history")
          }
        })
        .catch(() => {})
    }
    return () => {
      active = false
    }
  }, [evaluationId, evaluationsVersion, router])

  if (evaluationId) {
    return (
      <View style={styles.container}>
        <SummaryScreen evaluationId={evaluationId} />
        <ExportExamScreen
          evaluationId={evaluationId}
          evaluationName={evaluationName}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              "Eliminar evaluación",
              `¿Desea eliminar la evaluación "${evaluationName || "..."}"? Se eliminarán también sus estudiantes y el historial asociado.`,
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Eliminar",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await Database.deleteEvaluation(evaluationId)
                      notifyEvaluationsChanged()
                    } catch (err) {
                      console.error("Error deleting evaluation:", err)
                      Alert.alert("Error", "No se pudo eliminar la evaluación")
                    }
                  },
                },
              ],
            )
          }}
        >
          <Text style={styles.deleteButtonText}>Eliminar Evaluación</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <HistoryScreen />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  deleteButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dc2626",
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "bold",
  },
})

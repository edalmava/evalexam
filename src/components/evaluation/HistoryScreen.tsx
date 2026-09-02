import * as React from "react"
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, ActivityIndicator, Alert } from "react-native"
import { useRouter } from "expo-router"
import * as Database from "@/database"
import { notifyEvaluationsChanged, useEvaluationsVersion } from "@/lib/evaluationsEvents"

interface HistoryScreenProps {
  evaluationId?: string
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  evaluationId,
}) => {
  const router = useRouter()
  const [evaluations, setEvaluations] = React.useState([])
  const [searchText, setSearchText] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const evaluationsVersion = useEvaluationsVersion()

  React.useEffect(() => {
    const loadEvaluations = async () => {
      try {
        const evals = await Database.getLastFiveEvaluations()
        setEvaluations(evals)
        setLoading(false)
      } catch (err) {
        console.error("Error loading evaluations:", err)
        setLoading(false)
      }
    }

    loadEvaluations()
  }, [evaluationId, evaluationsVersion])

  const filteredEvaluations = evaluations.filter((item) => {
    if (!searchText) return true
    return item.name.toLowerCase().includes(searchText.toLowerCase())
  })

  const handleEvaluationPress = (evalId: string) => {
    router.push({ pathname: "/history", params: { evaluationId: evalId } })
  }

  const handleDeleteEvaluation = (evalId: string, name: string) => {
    Alert.alert(
      "Eliminar evaluación",
      `¿Desea eliminar la evaluación "${name}"? Se eliminarán también sus estudiantes y el historial asociado.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await Database.deleteEvaluation(evalId)
              notifyEvaluationsChanged()
            } catch (err) {
              console.error("Error deleting evaluation:", err)
              Alert.alert("Error", "No se pudo eliminar la evaluación")
            }
          },
        },
      ],
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Buscar evaluación..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.input}
        />
      </View>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}

      <FlatList
        data={filteredEvaluations}
        renderItem={({ item }) => (
          <View style={styles.evaluationItem}>
            <TouchableOpacity
              style={styles.evaluationBody}
              onPress={() => handleEvaluationPress(item.id)}
            >
              <View style={styles.evaluationInfo}>
                <Text style={styles.evaluationName}>{item.name}</Text>
                <Text style={styles.evaluationDetails}>
                  {item.studentCount} estudiantes • {item.averageScore?.toFixed(2) || "0"} promedio
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteEvaluation(item.id, item.name)}
            >
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        horizontal={false}
      />

      {evaluations.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay evaluaciones guardadas</Text>
          <Text style={styles.emptySubText}>Pruebe crear una evaluación primero</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: "white",
  },
  loading: {
    marginVertical: 20,
  },
  evaluationItem: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  evaluationBody: {
    flex: 1,
  },
  deleteButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  deleteButtonText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
  },
  evaluationInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  evaluationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
  },
  evaluationDetails: {
    fontSize: 12,
    color: "#718096",
  },
  emptyState: {
    padding: 20,
    textAlign: "center",
    color: "#718096",
  },
  emptySubText: {
    marginTop: 5,
    fontSize: 14,
  },
})
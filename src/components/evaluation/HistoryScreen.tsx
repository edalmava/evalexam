import * as React from "react"
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, FlatList, TextInput, ActivityIndicator } from "react-native"
import * as Database from "@/database"

interface HistoryScreenProps {
  evaluationId?: string
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  evaluationId,
}) => {
  const [evaluations, setEvaluations] = React.useState([])
  const [searchText, setSearchText] = React.useState("")
  const [loading, setLoading] = React.useState(true)

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
  }, [evaluationId])

  const filteredEvaluations = evaluations.filter((eval) => {
    if (!searchText) return true
    return eval.name.toLowerCase().includes(searchText.toLowerCase())
  })

  const handleEvaluationPress = (evalId: string) => {
    // Navegar a la pantalla de detalles
    Alert.alert("Evaluación", `Ver detalles de: ${evalId}`)
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
          <ActivityIndicator size="medium" />
        </View>
      )}

      <FlatList
        data={filteredEvaluations}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.evaluationItem}
            onPress={() => handleEvaluationPress(item.id)}
          >
            <View style={styles.evaluationInfo}>
              <Text style={styles.evaluationName}>{item.name}</Text>
              <Text style={styles.evaluationDetails}>
                {item.studentCount} estudiantes • {item.averageScore?.toFixed(2) || "0"} promedio
              </Text>
            </View>
          </TouchableOpacity>
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
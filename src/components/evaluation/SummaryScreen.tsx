import * as React from "react"
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, FlatList, ActivityIndicator } from "react-native"
import * as Database from "@/database"
import { calculateScore } from "@/lib/calculateScore"

interface StudentSummary {
  id: string
  code: string
  name: string
  answers: string[]
  score: number
}

interface SummaryScreenProps {
  evaluationId: string
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  evaluationId,
}) => {
  const [students, setStudents] = React.useState<StudentSummary[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const loadStudents = async () => {
      try {
        const studentRecords = await Database.selectStudentsByEvaluation(evaluationId)
        setStudents(
          studentRecords.map((record: any) => ({
            id: record.id,
            code: record.code,
            name: record.name,
            answers: record.answers ? JSON.parse(record.answers) : [],
            score: record.score || 0,
          }))
        )
        setLoading(false)
      } catch (err) {
        setError("Error al cargar estudiantes: " + (err as Error).message)
        setLoading(false)
      }
    }

    loadStudents()
  }, [evaluationId])

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button title="Reintentar" onPress={() => {}} />
      </View>
    )
  }

  // Calcular estadísticas
  const totalStudents = students.length
  const scores = students.map((s) => s.score)
  const averageScore =
    scores.length > 0
      ? scores.reduce((acc, val) => acc + val, 0) / scores.length
      : 0
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0
  const minScore = scores.length > 0 ? Math.min(...scores) : 0

  // Distribución por rangos
  const distribution = {
    "90-100": scores.filter((s) => s >= 90).length,
    "80-89": scores.filter((s) => s >= 80 && s < 90).length,
    "70-79": scores.filter((s) => s >= 70 && s < 80).length,
    "60-69": scores.filter((s) => s >= 60 && s < 70).length,
    "Below 60": scores.filter((s) => s < 60).length,
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen General</Text>

      <View style={statsContainer}>
        <View style={statItem}>
          <Text style={statValue>{totalStudents}</Text>
          <Text style={statLabel}>Estudiantes</Text>
        </View>
        <View style={statItem}>
          <Text style={statValue}>{averageScore.toFixed(2)}</Text>
          <Text style={statLabel}>Promedio</Text>
        </View>
        <View style={statItem}>
          <Text style={statValue}>{maxScore}</Text>
          <Text style={statLabel}>Máximo</Text>
        </View>
        <View style={statItem}>
          <Text style={statValue}>{minScore}</Text>
          <Text style={statLabel}>Mínimo</Text>
        </View>
      </View>

      <View style={distributionContainer}>
        <Text style={distributionTitle>Distribución de Notas</Text>
        {Object.entries(distribution).map(([range, count]) => (
          <View key={range} style={distributionItem}>
            <Text style={distributionRange}>{range}</Text>
            <Text style={distributionCount}>{count} estudiantes</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={students}
        renderItem={({ item }) => (
          <View style={studentItem}>
            <Text style={studentCode}>{item.code}</Text>
            <Text style={studentName}>{item.name}</Text>
            <Text style={studentScore}>Nota: {item.score}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        horizontal={false}
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    minWidth: "45%",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3748",
  },
  statLabel: {
    fontSize: 14,
    color: "#718096",
    marginTop: 4,
  },
  distributionContainer: {
    marginBottom: 20,
  },
  distributionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2d3748",
  },
  distributionItem: {
    marginBottom: 5,
    padding: 5,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
  },
  studentItem: {
    padding: 10,
    backgroundColor: "white",
    marginBottom: 8,
    borderRadius: 6,
  },
  studentCode: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4a5568",
  },
  studentName: {
    fontSize: 16,
    color: "#2d3748",
    marginLeft: 10,
  },
  studentScore: {
    fontSize: 14,
    color: "#059669",
    marginLeft: "auto",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
})
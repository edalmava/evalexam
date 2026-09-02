import * as React from "react"
import { View, Text, StyleSheet, ActivityIndicator, Button } from "react-native"
import * as Database from "@/database"

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

interface ScoreRange {
  label: string
  min: number
  max: number
}

const buildScoreRanges = (maxScore: number, gradingSystem: string): ScoreRange[] => {
  const minimum = gradingSystem === "1-to-max" ? 1 : 0
  const span = Math.max(maxScore - minimum, 0.0001)
  const bandCount = 5
  const bandSize = span / bandCount

  const ranges: ScoreRange[] = []
  for (let i = 0; i < bandCount; i++) {
    const bandMin = minimum + i * bandSize
    const bandMax = i === bandCount - 1 ? maxScore : bandMin + bandSize
    ranges.push({
      label:
        i === 0 && minimum === 0
          ? `${bandMin.toFixed(2)} - ${bandMax.toFixed(2)}`
          : `${bandMin.toFixed(2)} - ${bandMax.toFixed(2)}`,
      min: bandMin,
      max: bandMax,
    })
  }
  return ranges
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  evaluationId,
}) => {
  const [students, setStudents] = React.useState<StudentSummary[]>([])
  const [evaluationMaxScore, setEvaluationMaxScore] = React.useState(5)
  const [gradingSystem, setGradingSystem] = React.useState("0-to-max")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const loadStudents = async () => {
      try {
        const evaluation = await Database.selectEvaluation(evaluationId)
        if (evaluation) {
          setEvaluationMaxScore(Number(evaluation.maxScore))
          setGradingSystem(String(evaluation.gradingSystem))
        }
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

  // Distribución por rangos derivados de la nota máxima configurable
  const ranges = buildScoreRanges(evaluationMaxScore, gradingSystem)
  const distribution = ranges.map((range) => ({
    ...range,
    count: scores.filter(
      (s) => s >= range.min && (range.max === evaluationMaxScore ? s <= range.max : s < range.max)
    ).length,
  }))

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen General</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalStudents}</Text>
          <Text style={styles.statLabel}>Estudiantes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{averageScore.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Promedio</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{maxScore}</Text>
          <Text style={styles.statLabel}>Máximo</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{minScore}</Text>
          <Text style={styles.statLabel}>Mínimo</Text>
        </View>
      </View>

      <View style={styles.distributionContainer}>
        <Text style={styles.distributionTitle}>Distribución de Notas</Text>
        {distribution.map((range) => (
          <View key={range.label} style={styles.distributionItem}>
            <Text style={styles.distributionRange}>{range.label}</Text>
            <Text style={styles.distributionCount}>{range.count} estudiantes</Text>
          </View>
        ))}
      </View>

      <View style={styles.studentsContainer}>
        {students.map((item) => (
          <View key={item.id} style={styles.studentItem}>
            <Text style={styles.studentCode}>{item.code}</Text>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentScore}>Nota: {item.score}</Text>
          </View>
        ))}
      </View>
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
  distributionRange: {
    fontSize: 14,
    color: "#2d3748",
  },
  distributionCount: {
    fontSize: 14,
    color: "#718096",
  },
  studentsContainer: {
    marginBottom: 20,
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
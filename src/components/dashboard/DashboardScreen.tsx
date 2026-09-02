import * as React from "react"
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { useRouter } from "expo-router"
import * as Database from "@/database"
import { DashboardStats } from "./DashboardStats"
import { RecentEvaluations } from "./RecentEvaluations"
import { EmptyState } from "./EmptyState"
import {
  formatRecentEvaluations,
  buildDashboardStats,
  DashboardStatsData,
  RecentEvaluation,
} from "@/lib/dashboardStats"
import { notifyEvaluationsChanged, useEvaluationsVersion } from "@/lib/evaluationsEvents"

export const DashboardScreen: React.FC = () => {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const evaluationsVersion = useEvaluationsVersion()
  const [stats, setStats] = React.useState<DashboardStatsData>({
    totalEvaluations: 0,
    totalStudents: 0,
    averageScore: 0,
    lastEvaluationName: null,
  })
  const [recent, setRecent] = React.useState<RecentEvaluation[]>([])

  const loadDashboard = React.useCallback(
    (
      onResult: (data: {
        stats: DashboardStatsData
        recent: RecentEvaluation[]
      }) => void,
      onError: (error: unknown) => void,
    ) => {
      Promise.all([
        Database.countEvaluations(),
        Database.countTotalStudents(),
        Database.getAverageScore(),
        Database.getRecentEvaluationsWithStats(),
      ])
        .then(([totalEvaluations, totalStudents, averageScore, recentEvals]) => {
          const formatted: RecentEvaluation[] = formatRecentEvaluations(
            recentEvals as any[],
          )
          onResult({
            stats: buildDashboardStats(
              totalEvaluations,
              totalStudents,
              averageScore,
              formatted,
            ),
            recent: formatted,
          })
        })
        .catch((err) => onError(err))
    },
    [],
  )

  React.useEffect(() => {
    let cancelled = false
    loadDashboard(
      ({ stats, recent }) => {
        if (cancelled) return
        setStats(stats)
        setRecent(recent)
        setLoading(false)
      },
      (err) => {
        if (!cancelled) {
          console.error("Error loading dashboard", err)
          setLoading(false)
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [loadDashboard, evaluationsVersion])

  const handleCreateExam = () => {
    router.push("/exams")
  }

  const handleSelectEvaluation = (evaluationId: string) => {
    router.push(`/history?evaluationId=${evaluationId}`)
  }

  const handleDeleteEvaluation = (evaluationId: string, name: string) => {
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
              await Database.deleteEvaluation(evaluationId)
              notifyEvaluationsChanged()
            } catch (err) {
              console.error("Error deleting evaluation", err)
              Alert.alert("Error", "No se pudo eliminar la evaluación")
            }
          },
        },
      ],
    )
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (stats.totalEvaluations === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Dashboard</Text>
        <EmptyState onCreateExam={handleCreateExam} />
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dashboard</Text>

      <DashboardStats stats={stats} />

      <TouchableOpacity style={styles.newExamButton} onPress={handleCreateExam}>
        <Text style={styles.newExamButtonText}>Nueva Evaluación</Text>
      </TouchableOpacity>

      <RecentEvaluations
        evaluations={recent}
        onSelectEvaluation={handleSelectEvaluation}
        onDeleteEvaluation={handleDeleteEvaluation}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2d3748",
  },
  newExamButton: {
    backgroundColor: "#42b983",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  newExamButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
})

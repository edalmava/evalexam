import * as React from "react"
import { View, Text, StyleSheet } from "react-native"
import { DashboardStatsData } from "@/lib/dashboardStats"

interface DashboardStatsProps {
  stats: DashboardStatsData
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estadísticas</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalEvaluations}</Text>
          <Text style={styles.statLabel}>Evaluaciones</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Estudiantes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {stats.averageScore ? stats.averageScore.toFixed(2) : "0"}
          </Text>
          <Text style={styles.statLabel}>Promedio</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue} numberOfLines={1}>
            {stats.lastEvaluationName || "—"}
          </Text>
          <Text style={styles.statLabel}>Última evaluación</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#2d3748",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3748",
  },
  statLabel: {
    fontSize: 13,
    color: "#718096",
    marginTop: 4,
    textAlign: "center",
  },
})

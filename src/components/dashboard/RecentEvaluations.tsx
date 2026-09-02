import * as React from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native"
import { RecentEvaluation } from "@/lib/dashboardStats"

interface RecentEvaluationsProps {
  evaluations: RecentEvaluation[]
  onSelectEvaluation: (evaluationId: string) => void
  onDeleteEvaluation: (evaluationId: string, name: string) => void
}

export const RecentEvaluations: React.FC<RecentEvaluationsProps> = ({
  evaluations,
  onSelectEvaluation,
  onDeleteEvaluation,
}) => {
  const renderItem = ({ item }: { item: RecentEvaluation }) => (
    <View style={styles.evaluationItem}>
      <TouchableOpacity
        style={styles.evaluationBody}
        onPress={() => onSelectEvaluation(item.id)}
      >
        <View style={styles.evaluationInfo}>
          <View style={styles.evaluationHeader}>
            <Text style={styles.evaluationName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.status === "draft" && (
              <Text style={styles.draftBadge}>Evaluación encontrada sin guardar</Text>
            )}
          </View>
          <Text style={styles.evaluationDetails}>
            {item.date} • {item.studentCount} estudiantes •{" "}
            {item.averageScore != null ? item.averageScore.toFixed(2) : "0"}{" "}
            promedio
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDeleteEvaluation(item.id, item.name)}
      >
        <Text style={styles.deleteButtonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Evaluaciones Recientes</Text>
      <FlatList
        data={evaluations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay evaluaciones recientes</Text>
        }
      />
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
    gap: 4,
  },
  evaluationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  evaluationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    flexShrink: 1,
  },
  draftBadge: {
    fontSize: 12,
    color: "#b7791f",
    backgroundColor: "#fefcbf",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  evaluationDetails: {
    fontSize: 12,
    color: "#718096",
  },
  emptyText: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    paddingVertical: 20,
  },
})

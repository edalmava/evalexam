import * as React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"

interface EmptyStateProps {
  onCreateExam?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateExam }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.emptyText}>No hay evaluaciones guardadas</Text>
      <Text style={styles.emptySubText}>
        Crea tu primera evaluación para comenzar a calificar
      </Text>
      {onCreateExam && (
        <TouchableOpacity style={styles.button} onPress={onCreateExam}>
          <Text style={styles.buttonText}>Crear Primera Evaluación</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#718096",
    marginTop: 8,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#42b983",
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
    width: "100%",
    maxWidth: 260,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})

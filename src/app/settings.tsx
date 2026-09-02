import * as React from "react"
import { View, Text, ScrollView, StyleSheet } from "react-native"

export default function SettingsTabScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Configuración</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de la app</Text>
        <Text style={styles.sectionText}>
          EvalExam permite calificar automáticamente evaluaciones tipo ICFES de
          selección múltiple con única respuesta.
        </Text>
        <Text style={styles.sectionText}>
          Los datos se almacenan localmente en el dispositivo y funcionan sin
          conexión a Internet.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Funcionalidades</Text>
        <Text style={styles.bullet}>• Configuración de evaluaciones</Text>
        <Text style={styles.bullet}>• Clave de respuestas</Text>
        <Text style={styles.bullet}>• Respuestas de estudiantes</Text>
        <Text style={styles.bullet}>• Foto de evidencia</Text>
        <Text style={styles.bullet}>• Resumen y estadísticas</Text>
        <Text style={styles.bullet}>• Exportación a PDF y JSON</Text>
        <Text style={styles.bullet}>• Historial de evaluaciones</Text>
      </View>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2d3748",
  },
  section: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 6,
    lineHeight: 20,
  },
  bullet: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 4,
    lineHeight: 20,
  },
})

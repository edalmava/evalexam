import * as React from "react"
import { View, Text, Button, Alert, StyleSheet, AsyncStorage } from "react-native"
import * as Document from "expo-document"
import * as FileSystem from "expo-file-system"

interface ExportExamProps {
  evaluationId: string
  evaluationName: string
  students: any[]
}

export const exportExamToJSON = async (evaluationId: string): Promise<string> => {
  try {
    // Obtener datos de la evaluación
    const evaluation = await Database.selectEvaluation(evaluationId)
    if (!evaluation) {
      throw new Error("Evaluación no encontrada")
    }

    // Obtener estudiantes
    const students = await Database.selectStudentsByEvaluation(evaluationId)

    // Formato JSON completo
    const jsonData = {
      evaluation: {
        id: evaluation.id,
        name: evaluation.name,
        date: evaluation.date,
        academicPeriod: evaluation.academicPeriod,
        totalQuestions: evaluation.totalQuestions,
        gradingSystem: evaluation.gradingSystem,
        maxScore: evaluation.maxScore,
        questionWeights: evaluation.questionWeights ? JSON.parse(evaluation.questionWeights) : [],
        createdAt: evaluation.createdAt,
      },
      students: students.map((student) => ({
        id: student.id,
        code: student.code,
        name: student.name,
        answers: student.answers ? JSON.parse(student.answers) : [],
        score: student.score,
        photoPath: student.photoPath,
      })),
      exportedAt: new Date().toISOString(),
    }

    return JSON.stringify(jsonData, null, 2)
  } catch (error) {
    console.error("Error exporting to JSON:", error)
    throw error
  }
}

export const exportExamToPDF = async (evaluationId: string): Promise<string> => {
  try {
    // Obtener datos de la evaluación
    const evaluation = await Database.selectEvaluation(evaluationId)
    if (!evaluation) {
      throw new Error("Evaluación no encontrada")
    }

    // Obtener estudiantes
    const students = await Database.selectStudentsByEvaluation(evaluationId)

    // Generar contenido PDF usando la API de expo-document
    const pages: any[] = []

    // Portada
    pages.push({
      type: "page",
      content: [
        {
          type: "text",
          text: "EVALUACIÓN ICFES",
          style: { fontSize: 32, fontWeight: "bold", textAlign: "center" },
        },
        {
          type: "text",
          text: evaluation.name,
          style: { fontSize: 24, textAlign: "center", marginTop: 10 },
        },
        {
          type: "text",
          text: `Fecha: ${evaluation.date}`,
          style: { fontSize: 16, textAlign: "center", marginTop: 20 },
        },
      ],
    })

    // Información de la evaluación
    pages.push({
      type: "page",
      content: [
        {
          type: "text",
          text: "INFORMACIÓN DE LA EVALUACIÓN",
          style: { fontSize: 18, fontWeight: "bold" },
        },
        {
          type: "text", text: `Período: ${evaluation.academicPeriod}`, style: { marginTop: 5 },
        },
        {
          type: "text", text: `Preguntas: ${evaluation.totalQuestions}`, style: { marginTop: 5 },
        },
        {
          type: "text", text: `Sistema de calificación: ${evaluation.gradingSystem}`, style: { marginTop: 5 },
        },
        {
          type: "text", text: `Nota máxima: ${evaluation.maxScore}`, style: { marginTop: 5 },
        },
      ],
    })

    // Resultados de estudiantes
    pages.push({
      type: "page",
      content: [
        {
          type: "text",
          text: "RESULTADOS DE ESTUDIANTES",
          style: { fontSize: 18, fontWeight: "bold" },
        },
        { type: "spacer", height: 10 },
      ],
    })

    students.forEach((student, index) => {
      pages.push({
        type: "page",
        content: [
          {
            type: "text",
            text: `Estudiante ${index + 1}: ${student.name} (${student.code})`,
            style: { fontSize: 16, marginTop: 10 },
          },
          {
            type: "text", text: `Respuestas: ${student.answers?.join(", ") || "N/A"}`, style: { marginTop: 5 },
          },
          {
            type: "text", text: `Nota final: ${student.score}`, style: { marginTop: 5, fontWeight: "bold" },
          },
        ],
      })
    })

    // Guardar PDF
    const pdfUri = await Document.create(
      {
        pages,
        title: `${evaluation.name}.pdf`,
      },
      Document.PermissionType.READ_WRITE,
    )

    return pdfUri
  } catch (error) {
    console.error("Error exporting to PDF:", error)
    throw error
  }
}

export const ExportExamScreen: React.FC = () => {
  const [evaluationId, setEvaluationId] = React.useState("")
  const [exporting, setExporting] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState("")

  const handleExportJSON = async () => {
    setExporting(true)
    setStatusMessage("Generando JSON...")
    try {
      const jsonData = await exportExamToJSON(evaluationId)
      // Guardar en AsyncStorage
      await AsyncStorage.setItem("last_export_json", jsonData)
      setStatusMessage("JSON guardado exitosamente")
      Alert.alert("Éxito", "Archivo JSON generado y guardado")
    } catch (error) {
      setStatusMessage("Error al generar JSON")
      Alert.alert("Error", "No se pudo generar el archivo JSON")
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    setStatusMessage("Generando PDF...")
    try {
      const pdfUri = await exportExamToPDF(evaluationId)
      setStatusMessage("PDF generado exitosamente")
      Alert.alert("Éxito", `PDF guardado en: ${pdfUri}`)
    } catch (error) {
      setStatusMessage("Error al generar PDF")
      Alert.alert("Error", "No se pudo generar el PDF")
    } finally {
      setExporting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title>Exportar Evaluación</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>ID de Evaluación:</Text>
        <Text style={styles.value}>{evaluationId}</Text>
      </View>

      {exporting && (
        <View style={styles.exporting}>
          <Text>{statusMessage}</Text>
        </View>
      )}

      <View style={styles.buttons}>
        <Button title="Exportar a JSON" onPress={handleExportJSON} />
        <Button title="Exportar a PDF" onPress={handleExportPDF} />
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
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: "#4a5568",
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: "#2d3748",
    marginTop: 5,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  exporting: {
    margin: 20,
    padding: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
})
import * as React from "react"
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"
import { File, Paths, EncodingType } from "expo-file-system"
import * as Database from "@/database"

interface ExportExamProps {
  evaluationId: string
  evaluationName?: string
}

interface JSONRow {
  evaluation: Record<string, unknown>
  students: Array<Record<string, unknown>>
  exportedAt: string
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

export const exportExamToJSON = async (evaluationId: string): Promise<string> => {
  const evaluation = await Database.selectEvaluation(evaluationId)
  if (!evaluation) {
    throw new Error("Evaluación no encontrada")
  }

  const students = await Database.selectStudentsByEvaluation(evaluationId)

  const jsonData: JSONRow = {
    evaluation: {
      id: evaluation.id,
      name: evaluation.name,
      date: evaluation.date,
      academicPeriod: evaluation.academicPeriod,
      totalQuestions: evaluation.totalQuestions,
      gradingSystem: evaluation.gradingSystem,
      maxScore: evaluation.maxScore,
      questionWeights: evaluation.questionWeights
        ? JSON.parse(evaluation.questionWeights)
        : [],
      createdAt: evaluation.createdAt,
    },
    students: students.map((student: any) => ({
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
}

const buildEvaluationHtml = (evaluation: any, students: any[]): string => {
  const rows = students
    .map((student) => {
      const answers = student.answers ? JSON.parse(student.answers) : []
      return `
        <tr>
          <td>${escapeHtml(String(student.code))}</td>
          <td>${escapeHtml(String(student.name))}</td>
          <td>${escapeHtml(answers.join(", ") || "N/A")}</td>
          <td style="text-align:center"><strong>${Number(student.score).toFixed(2)}</strong></td>
        </tr>
      `
    })
    .join("")

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Helvetica, Arial, sans-serif; color: #2d3748; padding: 24px; }
          h1 { text-align: center; font-size: 26px; margin-bottom: 4px; }
          h2 { text-align: center; font-size: 18px; margin-top: 0; color: #718096; }
          .meta { margin: 20px 0; font-size: 13px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #cbd5e0; padding: 8px; font-size: 12px; text-align: left; }
          th { background-color: #e2e8f0; }
          .section-title { font-size: 15px; font-weight: bold; margin-top: 24px; }
        </style>
      </head>
      <body>
        <h1>Evaluación ICFES</h1>
        <h2>${escapeHtml(String(evaluation.name))}</h2>
        <div class="meta">
          <div><strong>Fecha:</strong> ${escapeHtml(String(evaluation.date))}</div>
          <div><strong>Período:</strong> ${escapeHtml(String(evaluation.academicPeriod))}</div>
          <div><strong>Preguntas:</strong> ${Number(evaluation.totalQuestions)}</div>
          <div><strong>Sistema de calificación:</strong> ${escapeHtml(String(evaluation.gradingSystem))}</div>
          <div><strong>Nota máxima:</strong> ${Number(evaluation.maxScore)}</div>
        </div>
        <div class="section-title">Resultados de estudiantes</div>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Respuestas</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `
}

export const exportExamToPDF = async (evaluationId: string): Promise<string> => {
  const evaluation = await Database.selectEvaluation(evaluationId)
  if (!evaluation) {
    throw new Error("Evaluación no encontrada")
  }

  const students = await Database.selectStudentsByEvaluation(evaluationId)
  const html = buildEvaluationHtml(evaluation, students)

  const file = await Print.printToFileAsync({ html })
  return file.uri
}

export const ExportExamScreen: React.FC<ExportExamProps> = ({
  evaluationId,
  evaluationName,
}) => {
  const [exporting, setExporting] = React.useState(false)
  const [sharing, setSharing] = React.useState(false)

  const handleExportJSON = async () => {
    setExporting(true)
    try {
      const jsonData = await exportExamToJSON(evaluationId)
      const fileName = `${evaluationName || "evaluacion"}.json`.replace(/\s+/g, "_")
      const file = new File(Paths.cache, fileName)
      file.create()
      file.write(jsonData, { encoding: EncodingType.UTF8 })
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "application/json" })
      } else {
        Alert.alert("Éxito", `JSON generado en: ${file.uri}`)
      }
    } catch (error) {
      console.error("Error exporting to JSON:", error)
      Alert.alert("Error", "No se pudo generar el archivo JSON")
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const pdfUri = await exportExamToPDF(evaluationId)
      if (await Sharing.isAvailableAsync()) {
        setSharing(true)
        await Sharing.shareAsync(pdfUri, { mimeType: "application/pdf" })
        setSharing(false)
      } else {
        Alert.alert("Éxito", `PDF generado en: ${pdfUri}`)
      }
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      Alert.alert("Error", "No se pudo generar el PDF")
    } finally {
      setExporting(false)
      setSharing(false)
    }
  }

  const busy = exporting || sharing

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Exportar Evaluación</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Evaluación</Text>
        <Text style={styles.infoValue}>{evaluationName || evaluationId}</Text>
      </View>

      {busy && (
        <View style={styles.exporting}>
          <ActivityIndicator size="small" />
          <Text style={styles.exportingText}>
            {sharing ? "Compartiendo archivo..." : "Generando..."}
          </Text>
        </View>
      )}

      <View style={styles.buttons}>
        <View style={styles.buttonWrapper}>
          <Button
            title="Exportar a JSON"
            onPress={handleExportJSON}
            disabled={busy}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title="Exportar a PDF"
            onPress={handleExportPDF}
            disabled={busy}
          />
        </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2d3748",
  },
  infoBox: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#2d3748",
  },
  exporting: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
  },
  exportingText: {
    marginLeft: 10,
    color: "#4a5568",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
})

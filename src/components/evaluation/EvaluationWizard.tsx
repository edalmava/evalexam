import * as React from "react"
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native"
import { EvaluationForm } from "@/components/evaluation/EvaluationForm"
import { AnswerKey, AnswerKeyData } from "@/components/evaluation/AnswerKey"
import { StudentAnswers } from "@/components/evaluation/StudentAnswers"
import { SummaryScreen } from "@/components/evaluation/SummaryScreen"
import { notifyEvaluationsChanged } from "@/lib/evaluationsEvents"
import * as Database from "@/database"

interface EvaluationDraft {
  id: string
  name: string
  date: string
  academicPeriod: string
  totalQuestions: number
  totalStudents: number
  questionWeights: number[]
  gradingSystem: "0-to-max" | "1-to-max"
  maxScore: number
  weightMode: "equal" | "different"
  correctAnswers?: string[]
}

const STEPS = ["Configuración", "Clave de Respuestas", "Respuestas de Estudiantes", "Resumen"]

export const EvaluationWizard: React.FC = () => {
  const [step, setStep] = React.useState(0)
  const [evaluation, setEvaluation] = React.useState<EvaluationDraft | null>(null)

  const handleConfigSave = (config: EvaluationDraft) => {
    setEvaluation({ ...config, correctAnswers: evaluation?.correctAnswers || config.correctAnswers || [] })
    setStep(1)
  }

  const handleKeyDraftChange = React.useCallback(
    (key: AnswerKeyData, weightMode: "equal" | "different") => {
      setEvaluation((prev) =>
        prev
          ? {
              ...prev,
              questionWeights: key.weights,
              gradingSystem: key.gradingSystem,
              maxScore: key.maxScore,
              correctAnswers: key.correctAnswers,
              weightMode,
            }
          : prev,
      )
    },
    [],
  )

  const handleAnswerKeySave = async (key: AnswerKeyData) => {
    if (!evaluation) return
    try {
      await Database.updateEvaluationAnswerKey(evaluation.id, key.correctAnswers)
      setEvaluation({
        ...evaluation,
        questionWeights: key.weights,
        gradingSystem: key.gradingSystem,
        maxScore: key.maxScore,
        correctAnswers: key.correctAnswers,
      })
      setStep(2)
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la clave: " + (error as Error).message)
    }
  }

  const handleFinish = async () => {
    if (!evaluation) return
    try {
      const students = await Database.selectStudentsByEvaluation(evaluation.id)
      const scores = students.map((s: any) => s.score || 0)
      const studentCount = students.length
      const averageScore =
        scores.length > 0 ? scores.reduce((acc, val) => acc + val, 0) / scores.length : 0
      await Database.insertHistory(
        evaluation.id,
        new Date().toISOString().split("T")[0],
        studentCount,
        averageScore,
      )
      notifyEvaluationsChanged()
      setEvaluation(null)
      setStep(0)
      Alert.alert("Éxito", "Evaluación guardada en el historial")
    } catch (error) {
      Alert.alert("Error", "No se pudo finalizar la evaluación: " + (error as Error).message)
    }
  }

  const goBack = () => {
    if (step > 0) setStep(step - 1)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registrar Evaluación</Text>
        <Text style={styles.stepCounter}>
          Paso {step + 1} de {STEPS.length}: {STEPS[step]}
        </Text>
        <View style={styles.progressTrack}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressBar,
                index <= step ? styles.progressBarActive : styles.progressBarInactive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {step === 0 && (
          <EvaluationForm
            persist
            submitLabel="Guardar y Continuar"
            initialEvaluation={evaluation ?? undefined}
            onSave={handleConfigSave}
          />
        )}

        {step === 1 && evaluation && (
          <AnswerKey
            totalQuestions={evaluation.totalQuestions}
            initialWeights={evaluation.questionWeights}
            initialGradingSystem={evaluation.gradingSystem}
            initialMaxScore={evaluation.maxScore}
            initialCorrectAnswers={evaluation.correctAnswers}
            initialWeightMode={evaluation.weightMode}
            onChange={handleKeyDraftChange}
            submitLabel="Guardar Clave y Continuar"
            onSave={handleAnswerKeySave}
          />
        )}

        {step === 2 && evaluation && (
          <StudentAnswers
            evaluationId={evaluation.id}
            totalQuestions={evaluation.totalQuestions}
            onSave={() => {}}
          />
        )}

        {step === 3 && evaluation && (
          <View>
            <SummaryScreen evaluationId={evaluation.id} />
            <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
              <Text style={styles.finishButtonText}>Finalizar y Guardar en Historial</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {step > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>Atrás</Text>
          </TouchableOpacity>

          {step === 2 && evaluation && (
            <TouchableOpacity style={styles.nextButton} onPress={() => setStep(3)}>
              <Text style={styles.nextButtonText}>Ver Resumen</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2d3748",
    marginBottom: 6,
  },
  stepCounter: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    marginBottom: 12,
  },
  progressTrack: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  progressBarActive: {
    backgroundColor: "#42b983",
  },
  progressBarInactive: {
    backgroundColor: "#e2e8f0",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    backgroundColor: "#ffffff",
  },
  backButtonText: {
    color: "#2d3748",
    fontSize: 16,
    fontWeight: "600",
  },
  nextButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#42b983",
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  finishButton: {
    backgroundColor: "#42b983",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  finishButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
})

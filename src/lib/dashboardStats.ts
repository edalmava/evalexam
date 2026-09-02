export interface DashboardStatsData {
  totalEvaluations: number
  totalStudents: number
  averageScore: number
  lastEvaluationName: string | null
}

export interface RecentEvaluation {
  id: string
  name: string
  date: string
  studentCount: number
  averageScore: number | null
  status: "completed" | "draft"
}

export interface RawRecentEvaluation {
  id: string
  name: string
  date: string
  studentCount?: number
  averageScore?: number | null
  [key: string]: unknown
}

export const determineStatus = (studentCount: number): "completed" | "draft" => {
  return studentCount > 0 ? "completed" : "draft"
}

export const formatRecentEvaluations = (
  evaluations: RawRecentEvaluation[],
): RecentEvaluation[] => {
  return evaluations.map((evaluation) => {
    const studentCount = Number(evaluation.studentCount) || 0
    return {
      id: evaluation.id,
      name: evaluation.name,
      date: evaluation.date,
      studentCount,
      averageScore:
        evaluation.averageScore != null ? Number(evaluation.averageScore) : null,
      status: determineStatus(studentCount),
    }
  })
}

export const buildDashboardStats = (
  totalEvaluations: number,
  totalStudents: number,
  averageScore: number,
  recentEvaluations: RecentEvaluation[],
): DashboardStatsData => {
  return {
    totalEvaluations,
    totalStudents,
    averageScore,
    lastEvaluationName:
      recentEvaluations.length > 0 ? recentEvaluations[0].name : null,
  }
}

export const averageScoreOrDefault = (averageScore: number): number => {
  return averageScore || 0
}

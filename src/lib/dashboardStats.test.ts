import { describe, it, expect } from "vitest"
import {
  determineStatus,
  formatRecentEvaluations,
  buildDashboardStats,
  averageScoreOrDefault,
} from "./dashboardStats"

describe("dashboardStats - Estadísticas del Dashboard", () => {
  describe("determineStatus - Determinación de estado de la evaluación", () => {
    it("devuelve 'completed' cuando hay estudiantes", () => {
      expect(determineStatus(5)).toBe("completed")
      expect(determineStatus(1)).toBe("completed")
    })

    it("devuelve 'draft' cuando no hay estudiantes (RF-3)", () => {
      expect(determineStatus(0)).toBe("draft")
    })

    it("devuelve 'draft' para conteo negativo o inválido", () => {
      expect(determineStatus(-1)).toBe("draft")
      expect(determineStatus(NaN)).toBe("draft")
    })
  })

  describe("formatRecentEvaluations - Formato de evaluaciones recientes", () => {
    it("convierte correctamente los campos a los tipos esperados", () => {
      const result = formatRecentEvaluations([
        {
          id: "eval-001",
          name: "Matemáticas Basicas",
          date: "2024-05-15",
          studentCount: "30",
          averageScore: "3.5",
        },
      ])

      expect(result[0]).toEqual({
        id: "eval-001",
        name: "Matemáticas Basicas",
        date: "2024-05-15",
        studentCount: 30,
        averageScore: 3.5,
        status: "completed",
      })
    })

    it("asigna status 'draft' cuando no hay estudiantes (RF-3)", () => {
      const result = formatRecentEvaluations([
        {
          id: "eval-002",
          name: "Lenguaje",
          date: "2024-05-10",
          studentCount: 0,
        },
      ])

      expect(result[0].status).toBe("draft")
    })

    it("asigna averageScore null y studentCount 0 cuando faltan datos", () => {
      const result = formatRecentEvaluations([
        {
          id: "eval-003",
          name: "Ciencias",
          date: "2024-05-05",
        },
      ])

      expect(result[0].studentCount).toBe(0)
      expect(result[0].averageScore).toBeNull()
      expect(result[0].status).toBe("draft")
    })

    it("retorna arreglo vacío si no hay evaluaciones", () => {
      expect(formatRecentEvaluations([])).toEqual([])
    })
  })

  describe("buildDashboardStats - Construcción de estadísticas", () => {
    it("construye estadísticas correctas con evaluaciones recientes", () => {
      const stats = buildDashboardStats(3, 60, 4.2, [
        {
          id: "eval-001",
          name: "Matemáticas",
          date: "2024-05-15",
          studentCount: 30,
          averageScore: 4.2,
          status: "completed",
        },
      ])

      expect(stats).toEqual({
        totalEvaluations: 3,
        totalStudents: 60,
        averageScore: 4.2,
        lastEvaluationName: "Matemáticas",
      })
    })

    it("muestra null como última evaluación cuando no hay evaluaciones", () => {
      const stats = buildDashboardStats(0, 0, 0, [])
      expect(stats.lastEvaluationName).toBeNull()
    })
  })

  describe("averageScoreOrDefault - Manejo de promedio", () => {
    it("devuelve 0 cuando el promedio es null/0 (RNF validación de datos)", () => {
      expect(averageScoreOrDefault(0)).toBe(0)
      expect(averageScoreOrDefault(NaN)).toBe(0)
      expect(averageScoreOrDefault(undefined as any)).toBe(0)
    })

    it("devuelve el promedio cuando existe", () => {
      expect(averageScoreOrDefault(3.5)).toBe(3.5)
    })
  })
})

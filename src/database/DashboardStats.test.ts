import { describe, it, vi, beforeEach, expect } from "vitest"
import * as Database from "@/database"

const mockDb = {
  getFirstAsync: vi.fn(),
  getAllAsync: vi.fn(),
  closeAsync: vi.fn(),
}

vi.mock("expo-sqlite", () => ({
  openDatabaseAsync: vi.fn(async () => mockDb),
}))

vi.mock("expo-secure-store", () => ({
  // no-op mock for SecureStore, no calls needed in statistics functions
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.closeAsync.mockResolvedValue(undefined)
  mockDb.getFirstAsync.mockReset()
  mockDb.getAllAsync.mockReset()
})

describe("DashboardStats - Funciones de estadísticas de la base de datos", () => {
  it("countEvaluations cuenta el total de evaluaciones", async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 7 })
    const result = await Database.countEvaluations()
    expect(result).toBe(7)
    expect(mockDb.closeAsync).toHaveBeenCalled()
  })

  it("countEvaluations devuelve 0 ante ausencia de datos", async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 0 })
    expect(await Database.countEvaluations()).toBe(0)
  })

  it("countTotalStudents cuenta el total de estudiantes", async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 120 })
    const result = await Database.countTotalStudents()
    expect(result).toBe(120)
  })

  it("getAverageScore devuelve 0 cuando no hay notas", async () => {
    mockDb.getFirstAsync.mockResolvedValue({ average: null })
    expect(await Database.getAverageScore()).toBe(0)
  })

  it("getAverageScore devuelve el promedio calculado", async () => {
    mockDb.getFirstAsync.mockResolvedValue({ average: 4.25 })
    expect(await Database.getAverageScore()).toBe(4.25)
  })

  it("getLastEvaluation devuelve null cuando no hay evaluaciones", async () => {
    mockDb.getAllAsync.mockResolvedValue([])
    expect(await Database.getLastEvaluation()).toBeNull()
  })

  it("getLastEvaluation devuelve la evaluación más reciente", async () => {
    mockDb.getAllAsync.mockResolvedValue([{ id: "eval-001", name: "Matemáticas" }])
    const result = await Database.getLastEvaluation()
    expect(result).toEqual({ id: "eval-001", name: "Matemáticas" })
  })

  it("getRecentEvaluationsWithStats retorna evaluaciones con studentCount y averageScore", async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        id: "eval-001",
        name: "Matemáticas",
        studentCount: 30,
        averageScore: 3.5,
      },
    ])
    const result = await Database.getRecentEvaluationsWithStats()
    expect(result[0].studentCount).toBe(30)
    expect(result[0].averageScore).toBe(3.5)
  })
})

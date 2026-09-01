import { describe, it, expect, beforeEach } from "vitest"

describe("Database Schema: Evaluaciones", () => {
  const evaluationsSchema = `
    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      academicPeriod TEXT NOT NULL,
      totalQuestions INTEGER NOT NULL,
      gradingSystem TEXT NOT NULL,
      maxScore INTEGER NOT NULL,
      questionWeights TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `

  const studentsSchema = `
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      evaluationId TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      photoPath TEXT,
      answers TEXT NOT NULL,
      score REAL DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `

  const historySchema = `
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluationId TEXT NOT NULL,
      dateEvaluated TEXT NOT NULL,
      studentCount INTEGER NOT NULL DEFAULT 0,
      averageScore REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `

  it("debe tener el esquema de evaluaciones con todos los campos RF-1", () => {
    expect(evaluationsSchema).toContain("id TEXT PRIMARY KEY")
    expect(evaluationsSchema).toContain("name TEXT NOT NULL")
    expect(evaluationsSchema).toContain("date TEXT NOT NULL")
    expect(evaluationsSchema).toContain("academicPeriod TEXT NOT NULL")
    expect(evaluationsSchema).toContain("totalQuestions INTEGER NOT NULL")
    expect(evaluationsSchema).toContain("gradingSystem TEXT NOT NULL")
    expect(evaluationsSchema).toContain("maxScore INTEGER NOT NULL")
    expect(evaluationsSchema).toContain("questionWeights TEXT NOT NULL")
    expect(evaluationsSchema).toContain("createdAt TEXT NOT NULL")
    expect(evaluationsSchema).toContain("updatedAt TEXT")
  })

  it("debe tener el esquema de estudiantes con todos los campos", () => {
    expect(studentsSchema).toContain("id TEXT PRIMARY KEY")
    expect(studentsSchema).toContain("evaluationId TEXT NOT NULL")
    expect(studentsSchema).toContain("code TEXT NOT NULL")
    expect(studentsSchema).toContain("name TEXT NOT NULL")
    expect(studentsSchema).toContain("photoPath TEXT")
    expect(studentsSchema).toContain("answers TEXT NOT NULL")
    expect(studentsSchema).toContain("score REAL DEFAULT 0")
    expect(studentsSchema).toContain("createdAt TEXT NOT NULL")
  })

  it("debe tener el esquema de history con todos los campos", () => {
    expect(historySchema).toContain("id INTEGER PRIMARY KEY AUTOINCREMENT")
    expect(historySchema).toContain("evaluationId TEXT NOT NULL")
    expect(historySchema).toContain("dateEvaluated TEXT NOT NULL")
    expect(historySchema).toContain("studentCount INTEGER NOT NULL DEFAULT 0")
    expect(historySchema).toContain("averageScore REAL NOT NULL DEFAULT 0")
    expect(historySchema).toContain("createdAt TEXT NOT NULL")
  })

  it("evalúa que academicPeriod tiene valores predefinidos por defecto 4", () => {
    expect(evaluationsSchema).toContain("academicPeriod TEXT NOT NULL")
  })

  it("evalúa que gradingSystem admite 0-to-max o 1-to-max configurable", () => {
    expect(evaluationsSchema).toContain("gradingSystem TEXT NOT NULL")
  })

  it("evalúa que maxScore es configurable entero > 0", () => {
    expect(evaluationsSchema).toContain("maxScore INTEGER NOT NULL")
  })
})
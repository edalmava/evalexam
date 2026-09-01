import * as Database from "expo-sqlite"
import * as SecureStore from "expo-secure-store"

const DATABASE_NAME = "evalexam.db"
const ENCRYPTION_KEY = "evalexam-master-key"

export const createTables = async () => {
  const db = await Database.openDatabase(DATABASE_NAME, ENCRYPTION_KEY)
  await db.execAsync(`
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

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluationId TEXT NOT NULL,
      dateEvaluated TEXT NOT NULL,
      studentCount INTEGER NOT NULL DEFAULT 0,
      averageScore REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `)
  await db.closeAsync()
}

export const openDatabase = async (name: string, key: string) => {
  return Database.openDatabaseAsync(name, key)
}

export const insertEvaluation = async (
  id: string,
  name: string,
  date: string,
  academicPeriod: string,
  totalQuestions: number,
  gradingSystem: string,
  maxScore: number,
  questionWeights: number[],
) => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  await db.execAsync(`
    INSERT INTO evaluations (id, name, date, academicPeriod, totalQuestions, gradingSystem, maxScore, questionWeights, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `, [id, name, date, academicPeriod, totalQuestions, gradingSystem, maxScore, JSON.stringify(questionWeights)])
  await db.closeAsync()
}

export const selectEvaluation = async (id: string) => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  const result = await db.getAllAsync(
    "SELECT * FROM evaluations WHERE id = ?",
    [id],
  )
  await db.closeAsync()
  return result.length > 0 ? result[0] : null
}

export const selectLastFiveEvaluations = async () => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  const result = await db.getAllAsync(
    "SELECT * FROM evaluations ORDER BY createdAt DESC LIMIT 5",
    [],
  )
  await db.closeAsync()
  return result
}

export const insertStudent = async (
  id: string,
  evaluationId: string,
  code: string,
  name: string,
  photoPath: string | null,
  answers: string[],
) => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  await db.execAsync(`
    INSERT INTO students (id, evaluationId, code, name, photoPath, answers, score, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
  `, [id, evaluationId, code, name, photoPath || null, JSON.stringify(answers)])
  await db.closeAsync()
}

export const selectStudent = async (id: string) => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  const result = await db.getAllAsync("SELECT * FROM students WHERE id = ?", [id])
  await db.closeAsync()
  return result.length > 0 ? result[0] : null
}

export const selectStudentsByEvaluation = async (evaluationId: string) => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  const result = await db.getAllAsync(
    "SELECT * FROM students WHERE evaluationId = ?",
    [evaluationId],
  )
  await db.closeAsync()
  return result
}

export const insertHistory = async (
  evaluationId: string,
  dateEvaluated: string,
  studentCount: number,
  averageScore: number,
) => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  await db.execAsync(`
    INSERT INTO history (evaluationId, dateEvaluated, studentCount, averageScore, createdAt)
    VALUES (?, ?, ?, ?, datetime('now'))
  `, [evaluationId, dateEvaluated, studentCount, averageScore])
  await db.closeAsync()
}

export const selectHistoryByEvaluation = async (evaluationId: string) => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  const result = await db.getAllAsync(
    "SELECT * FROM history WHERE evaluationId = ?",
    [evaluationId],
  )
  await db.closeAsync()
  return result
}
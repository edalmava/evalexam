import * as Database from "expo-sqlite"
import * as SecureStore from "expo-secure-store"

const DATABASE_NAME = "evalexam.db"
const ENCRYPTION_KEY = "evalexam-master-key"

export const createTables = async () => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
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
      correctAnswers TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      evaluationId TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      photoPath TEXT,
      answers TEXT NOT NULL,
      score REAL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluationId TEXT NOT NULL,
      dateEvaluated TEXT NOT NULL,
      studentCount INTEGER NOT NULL DEFAULT 0,
      averageScore REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
  `)

  // Migración para instalaciones previas sin la columna correctAnswers (2026-09-01)
  try {
    await db.execAsync(`ALTER TABLE evaluations ADD COLUMN correctAnswers TEXT NOT NULL DEFAULT '[]'`)
  } catch (error) {
    // La columna ya existe (CREATE TABLE ya la incluye); ignorar
  }

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
  await db.runAsync(`
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

export const getLastFiveEvaluations = async () => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  const result = await db.getAllAsync(
    "SELECT * FROM evaluations ORDER BY createdAt DESC LIMIT 5",
    [],
  )
  await db.closeAsync()
  return result
}

export interface InsertStudentParams {
  id: string
  evaluationId: string
  code: string
  name: string
  photoPath: string | null
  answers: string[]
}

export const insertStudent = async ({
  id,
  evaluationId,
  code,
  name,
  photoPath,
  answers,
}: InsertStudentParams) => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  await db.runAsync(`
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
  await db.runAsync(`
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

export const deleteEvaluation = async (evaluationId: string) => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  await db.runAsync("DELETE FROM students WHERE evaluationId = ?", [evaluationId])
  await db.runAsync("DELETE FROM history WHERE evaluationId = ?", [evaluationId])
  await db.runAsync("DELETE FROM evaluations WHERE id = ?", [evaluationId])
  await db.closeAsync()
}

export const updateEvaluationAnswerKey = async (
  evaluationId: string,
  correctAnswers: string[],
) => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  await db.runAsync(
    "UPDATE evaluations SET correctAnswers = ?, updatedAt = datetime('now') WHERE id = ?",
    [JSON.stringify(correctAnswers), evaluationId],
  )
  await db.closeAsync()
}

export const updateEvaluation = async (
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
  await db.runAsync(
    "UPDATE evaluations SET name = ?, date = ?, academicPeriod = ?, totalQuestions = ?, gradingSystem = ?, maxScore = ?, questionWeights = ?, updatedAt = datetime('now') WHERE id = ?",
    [
      name,
      date,
      academicPeriod,
      totalQuestions,
      gradingSystem,
      maxScore,
      JSON.stringify(questionWeights),
      id,
    ],
  )
  await db.closeAsync()
}

export const updateStudentAnswers = async (
  studentId: string,
  answers: string[],
  score: number,
) => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  await db.runAsync(
    "UPDATE students SET answers = ?, score = ? WHERE id = ?",
    [JSON.stringify(answers), score, studentId],
  )
  await db.closeAsync()
}

export const countEvaluations = async (): Promise<number> => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  const result = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM evaluations",
  )
  await db.closeAsync()
  return Number(result?.count) || 0
}

export const countTotalStudents = async (): Promise<number> => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  const result = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM students",
  )
  await db.closeAsync()
  return Number(result?.count) || 0
}

export const getAverageScore = async (): Promise<number> => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  const result = await db.getFirstAsync(
    "SELECT AVG(score) as average FROM students WHERE score > 0",
  )
  await db.closeAsync()
  return Number(result?.average) || 0
}

export const getLastEvaluation = async () => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  const result = await db.getAllAsync(
    "SELECT * FROM evaluations ORDER BY createdAt DESC LIMIT 1",
  )
  await db.closeAsync()
  return result.length > 0 ? result[0] : null
}

export const getRecentEvaluationsWithStats = async () => {
  const db = await Database.openDatabaseAsync(DATABASE_NAME, ENCRYPTION_KEY)
  const result = await db.getAllAsync(
    `SELECT e.*, 
      (SELECT COUNT(*) FROM students WHERE evaluationId = e.id) as studentCount,
      (SELECT AVG(score) FROM students WHERE evaluationId = e.id AND score > 0) as averageScore
    FROM evaluations e
    ORDER BY e.createdAt DESC
    LIMIT 5`,
  )
  await db.closeAsync()
  return result
}
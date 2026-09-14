import * as Database from 'expo-sqlite';
import { SCHEMA_VERSION, SCHEMA_STATEMENTS, EVALUATIONS_MIGRATIONS } from './schema';

const DATABASE_NAME = 'evalexam.db';

export interface EvaluationRow {
  id: string;
  name: string;
  date: string;
  academicPeriod: string;
  totalQuestions: number;
  totalStudents: number;
  gradingSystem: string;
  maxScore: number;
  questionWeights: string;
  correctAnswers: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentRow {
  id: string;
  evaluationId: string;
  code: string;
  name: string;
  photoPath: string | null;
  answers: string;
  score: number;
  createdAt: string;
}

export interface HistoryRow {
  id: number;
  evaluationId: string;
  dateEvaluated: string;
  studentCount: number;
  averageScore: number;
  createdAt: string;
}

export interface RecentEvaluationWithStatsRow extends EvaluationRow {
  studentCount: number | null;
  averageScore: number | null;
}

export interface InsertStudentParams {
  id: string;
  evaluationId: string;
  code: string;
  name: string;
  photoPath: string | null;
  answers: string[];
}

let databasePromise: Promise<Database.SQLiteDatabase> | null = null;

const getDatabase = () => {
  databasePromise ??= Database.openDatabaseAsync(DATABASE_NAME);
  return databasePromise;
};

export const createTables = async () => {
  const db = await getDatabase();
  await db.execAsync(SCHEMA_STATEMENTS.join('\n'));

  // Migraciones idempotentes para instalaciones previas sin columnas añadidas
  for (const ddl of EVALUATIONS_MIGRATIONS) {
    const column = ddl.match(/ADD COLUMN (\w+)/)?.[1];
    if (!column) continue;
    const rows = await db.getAllAsync<{ name?: string }>('PRAGMA table_info(evaluations)');
    const exists = rows.some((row) => row.name === column);
    if (!exists) {
      await db.execAsync(ddl);
    }
  }

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = Number(versionRow?.user_version ?? 0);
  if (currentVersion < SCHEMA_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
};

export const insertEvaluation = async (
  id: string,
  name: string,
  date: string,
  academicPeriod: string,
  totalQuestions: number,
  totalStudents: number,
  gradingSystem: string,
  maxScore: number,
  questionWeights: number[],
) => {
  const db = await getDatabase();
  await db.runAsync(
    `
    INSERT INTO evaluations (id, name, date, academicPeriod, totalQuestions, totalStudents, gradingSystem, maxScore, questionWeights, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `,
    [
      id,
      name,
      date,
      academicPeriod,
      totalQuestions,
      totalStudents,
      gradingSystem,
      maxScore,
      JSON.stringify(questionWeights),
    ],
  );
};

export const selectEvaluation = async (id: string): Promise<EvaluationRow | null> => {
  const db = await getDatabase();
  const result = await db.getAllAsync<EvaluationRow>('SELECT * FROM evaluations WHERE id = ?', [
    id,
  ]);
  return result.length > 0 ? result[0] : null;
};

export const insertStudent = async ({
  id,
  evaluationId,
  code,
  name,
  photoPath,
  answers,
}: InsertStudentParams) => {
  const db = await getDatabase();
  await db.runAsync(
    `
    INSERT INTO students (id, evaluationId, code, name, photoPath, answers, score, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
  `,
    [id, evaluationId, code, name, photoPath || null, JSON.stringify(answers)],
  );
};

export const selectStudent = async (id: string): Promise<StudentRow | null> => {
  const db = await getDatabase();
  const result = await db.getAllAsync<StudentRow>('SELECT * FROM students WHERE id = ?', [id]);
  return result.length > 0 ? result[0] : null;
};

export const selectStudentsByEvaluation = async (evaluationId: string): Promise<StudentRow[]> => {
  const db = await getDatabase();
  const result = await db.getAllAsync<StudentRow>('SELECT * FROM students WHERE evaluationId = ?', [
    evaluationId,
  ]);
  return result;
};

export const insertHistory = async (
  evaluationId: string,
  dateEvaluated: string,
  studentCount: number,
  averageScore: number,
) => {
  const db = await getDatabase();
  await db.runAsync(
    `
    INSERT INTO history (evaluationId, dateEvaluated, studentCount, averageScore, createdAt)
    VALUES (?, ?, ?, ?, datetime('now'))
  `,
    [evaluationId, dateEvaluated, studentCount, averageScore],
  );
};

export const selectHistoryByEvaluation = async (evaluationId: string): Promise<HistoryRow[]> => {
  const db = await getDatabase();
  const result = await db.getAllAsync<HistoryRow>('SELECT * FROM history WHERE evaluationId = ?', [
    evaluationId,
  ]);
  return result;
};

export const deleteEvaluation = async (evaluationId: string) => {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM students WHERE evaluationId = ?', [evaluationId]);
    await txn.runAsync('DELETE FROM history WHERE evaluationId = ?', [evaluationId]);
    await txn.runAsync('DELETE FROM evaluations WHERE id = ?', [evaluationId]);
  });
};

export const updateEvaluationAnswerKey = async (evaluationId: string, correctAnswers: string[]) => {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE evaluations SET correctAnswers = ?, updatedAt = datetime('now') WHERE id = ?",
    [JSON.stringify(correctAnswers), evaluationId],
  );
};

export const updateEvaluation = async (
  id: string,
  name: string,
  date: string,
  academicPeriod: string,
  totalQuestions: number,
  totalStudents: number,
  gradingSystem: string,
  maxScore: number,
  questionWeights: number[],
) => {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE evaluations SET name = ?, date = ?, academicPeriod = ?, totalQuestions = ?, totalStudents = ?, gradingSystem = ?, maxScore = ?, questionWeights = ?, updatedAt = datetime('now') WHERE id = ?",
    [
      name,
      date,
      academicPeriod,
      totalQuestions,
      totalStudents,
      gradingSystem,
      maxScore,
      JSON.stringify(questionWeights),
      id,
    ],
  );
};

export const updateStudentAnswers = async (studentId: string, answers: string[], score: number) => {
  const db = await getDatabase();
  await db.runAsync('UPDATE students SET answers = ?, score = ? WHERE id = ?', [
    JSON.stringify(answers),
    score,
    studentId,
  ]);
};

export const updateStudent = async (studentId: string, code: string, name: string) => {
  const db = await getDatabase();
  await db.runAsync('UPDATE students SET code = ?, name = ? WHERE id = ?', [code, name, studentId]);
};

export const countEvaluations = async (): Promise<number> => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count?: number }>(
    'SELECT COUNT(*) as count FROM evaluations',
  );
  return Number(result?.count) || 0;
};

export const countTotalStudents = async (): Promise<number> => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count?: number }>(
    'SELECT COUNT(*) as count FROM students',
  );
  return Number(result?.count) || 0;
};

export const getAverageScore = async (): Promise<number> => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ average?: number }>(
    'SELECT AVG(score) as average FROM students WHERE score > 0',
  );
  return Number(result?.average) || 0;
};

export const getLastEvaluation = async (): Promise<EvaluationRow | null> => {
  const db = await getDatabase();
  const result = await db.getAllAsync<EvaluationRow>(
    'SELECT * FROM evaluations ORDER BY createdAt DESC LIMIT 1',
  );
  return result.length > 0 ? result[0] : null;
};

export const getRecentEvaluationsWithStats = async (): Promise<RecentEvaluationWithStatsRow[]> => {
  const db = await getDatabase();
  const result = await db.getAllAsync<RecentEvaluationWithStatsRow>(
    `SELECT e.*, 
      (SELECT COUNT(*) FROM students WHERE evaluationId = e.id) as studentCount,
      (SELECT AVG(score) FROM students WHERE evaluationId = e.id AND score > 0) as averageScore
    FROM evaluations e
    ORDER BY e.createdAt DESC
    LIMIT 5`,
  );
  return result;
};

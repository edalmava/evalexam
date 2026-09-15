export const SCHEMA_VERSION = 4;

export const EVALUATIONS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    academicPeriod TEXT NOT NULL,
    totalQuestions INTEGER NOT NULL,
    totalStudents INTEGER NOT NULL DEFAULT 0,
    gradingSystem TEXT NOT NULL,
    maxScore INTEGER NOT NULL,
    questionWeights TEXT NOT NULL,
    correctAnswers TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`;

export const STUDENTS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    evaluationId TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    photoPath TEXT,
    answers TEXT NOT NULL,
    score REAL DEFAULT 0,
    answersSource TEXT NOT NULL DEFAULT 'manual',
    createdAt TEXT NOT NULL
  );
`;

export const HISTORY_SCHEMA = `
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evaluationId TEXT NOT NULL,
    dateEvaluated TEXT NOT NULL,
    studentCount INTEGER NOT NULL DEFAULT 0,
    averageScore REAL NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );
`;

export const SCAN_LOGS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS scan_logs (
    id TEXT PRIMARY KEY,
    evaluationId TEXT NOT NULL,
    studentId TEXT,
    status TEXT NOT NULL,
    rawResponse TEXT,
    errorMessage TEXT,
    createdAt TEXT NOT NULL
  );
`;

export const SCHEMA_STATEMENTS: string[] = [
  EVALUATIONS_SCHEMA,
  STUDENTS_SCHEMA,
  HISTORY_SCHEMA,
  SCAN_LOGS_SCHEMA,
];

export const EVALUATIONS_MIGRATIONS: string[] = [
  'ALTER TABLE evaluations ADD COLUMN totalStudents INTEGER NOT NULL DEFAULT 0',
  "ALTER TABLE evaluations ADD COLUMN correctAnswers TEXT NOT NULL DEFAULT '[]'",
];

export const STUDENTS_MIGRATIONS: string[] = [
  "ALTER TABLE students ADD COLUMN answersSource TEXT NOT NULL DEFAULT 'manual'",
];

/**
 * Runner generalizado de migraciones: cada entrada se aplica a su tabla de
 * forma idempotente (PRAGMA table_info) usando el mismo patrón que antes solo
 * recorría `evaluations`. SCHEMA_VERSION se bumpa cuando se añade una entrada.
 */
export const TABLE_MIGRATIONS: { table: string; migrations: string[] }[] = [
  { table: 'evaluations', migrations: EVALUATIONS_MIGRATIONS },
  { table: 'students', migrations: STUDENTS_MIGRATIONS },
];

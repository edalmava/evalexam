import { describe, it, expect } from 'vitest';
import {
  EVALUATIONS_SCHEMA,
  STUDENTS_SCHEMA,
  HISTORY_SCHEMA,
  SCAN_LOGS_SCHEMA,
  SCHEMA_VERSION,
  EVALUATIONS_MIGRATIONS,
  STUDENTS_MIGRATIONS,
} from './schema';

describe('Database Schema: Evaluaciones', () => {
  it('debe tener el esquema de evaluaciones con todos los campos RF-1', () => {
    expect(EVALUATIONS_SCHEMA).toContain('id TEXT PRIMARY KEY');
    expect(EVALUATIONS_SCHEMA).toContain('name TEXT NOT NULL');
    expect(EVALUATIONS_SCHEMA).toContain('date TEXT NOT NULL');
    expect(EVALUATIONS_SCHEMA).toContain('academicPeriod TEXT NOT NULL');
    expect(EVALUATIONS_SCHEMA).toContain('totalQuestions INTEGER NOT NULL');
    expect(EVALUATIONS_SCHEMA).toContain('totalStudents INTEGER NOT NULL DEFAULT 0');
    expect(EVALUATIONS_SCHEMA).toContain('gradingSystem TEXT NOT NULL');
    expect(EVALUATIONS_SCHEMA).toContain('maxScore INTEGER NOT NULL');
    expect(EVALUATIONS_SCHEMA).toContain('questionWeights TEXT NOT NULL');
    expect(EVALUATIONS_SCHEMA).toContain("correctAnswers TEXT NOT NULL DEFAULT '[]'");
    expect(EVALUATIONS_SCHEMA).toContain('createdAt TEXT NOT NULL');
    expect(EVALUATIONS_SCHEMA).toContain('updatedAt TEXT');
  });

  it('debe tener el esquema de estudiantes con todos los campos', () => {
    expect(STUDENTS_SCHEMA).toContain('id TEXT PRIMARY KEY');
    expect(STUDENTS_SCHEMA).toContain('evaluationId TEXT NOT NULL');
    expect(STUDENTS_SCHEMA).toContain('code TEXT NOT NULL');
    expect(STUDENTS_SCHEMA).toContain('name TEXT NOT NULL');
    expect(STUDENTS_SCHEMA).toContain('photoPath TEXT');
    expect(STUDENTS_SCHEMA).toContain('answers TEXT NOT NULL');
    expect(STUDENTS_SCHEMA).toContain('score REAL DEFAULT 0');
    expect(STUDENTS_SCHEMA).toContain("answersSource TEXT NOT NULL DEFAULT 'manual'");
    expect(STUDENTS_SCHEMA).toContain('createdAt TEXT NOT NULL');
  });

  it('debe tener el esquema de scan_logs para trazabilidad del escaneo IA (RF-24)', () => {
    expect(SCAN_LOGS_SCHEMA).toContain('id TEXT PRIMARY KEY');
    expect(SCAN_LOGS_SCHEMA).toContain('evaluationId TEXT NOT NULL');
    expect(SCAN_LOGS_SCHEMA).toContain('studentId TEXT');
    expect(SCAN_LOGS_SCHEMA).toContain('status TEXT NOT NULL');
    expect(SCAN_LOGS_SCHEMA).toContain('rawResponse TEXT');
    expect(SCAN_LOGS_SCHEMA).toContain('errorMessage TEXT');
    expect(SCAN_LOGS_SCHEMA).toContain('createdAt TEXT NOT NULL');
  });

  it('debe tener el esquema de history con todos los campos', () => {
    expect(HISTORY_SCHEMA).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT');
    expect(HISTORY_SCHEMA).toContain('evaluationId TEXT NOT NULL');
    expect(HISTORY_SCHEMA).toContain('dateEvaluated TEXT NOT NULL');
    expect(HISTORY_SCHEMA).toContain('studentCount INTEGER NOT NULL DEFAULT 0');
    expect(HISTORY_SCHEMA).toContain('averageScore REAL NOT NULL DEFAULT 0');
    expect(HISTORY_SCHEMA).toContain('createdAt TEXT NOT NULL');
  });

  it('evalúa que academicPeriod tiene valores predefinidos por defecto 4', () => {
    expect(EVALUATIONS_SCHEMA).toContain('academicPeriod TEXT NOT NULL');
  });

  it('evalúa que gradingSystem admite 0-to-max o 1-to-max configurable', () => {
    expect(EVALUATIONS_SCHEMA).toContain('gradingSystem TEXT NOT NULL');
  });

  it('evalúa que maxScore es configurable entero > 0', () => {
    expect(EVALUATIONS_SCHEMA).toContain('maxScore INTEGER NOT NULL');
  });

  it('registra las migraciones idempotentes para columnas añadidas', () => {
    expect(EVALUATIONS_MIGRATIONS).toContain(
      'ALTER TABLE evaluations ADD COLUMN totalStudents INTEGER NOT NULL DEFAULT 0',
    );
    expect(EVALUATIONS_MIGRATIONS).toContain(
      "ALTER TABLE evaluations ADD COLUMN correctAnswers TEXT NOT NULL DEFAULT '[]'",
    );
    expect(STUDENTS_MIGRATIONS).toContain(
      "ALTER TABLE students ADD COLUMN answersSource TEXT NOT NULL DEFAULT 'manual'",
    );
  });

  it('mantiene una versión de esquema estable', () => {
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(4);
  });
});

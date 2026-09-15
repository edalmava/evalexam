import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StudentAnswers } from '@/components/evaluation/student-answers';
import * as Database from '@/database';

const mockStudent: Database.StudentRow = {
  id: 'student-001',
  evaluationId: 'eval-001',
  code: 'E001',
  name: 'Maria Perez',
  photoPath: null,
  answers: '[]',
  score: 0,
  answersSource: 'manual',
  createdAt: '2024-05-15T10:00:00.000Z',
};

const mockEvaluation: Database.EvaluationRow = {
  id: 'eval-001',
  name: 'Matemáticas Basicas',
  date: '2024-05-15',
  academicPeriod: 'Primer Período',
  totalQuestions: 10,
  totalStudents: 1,
  gradingSystem: '0-to-max',
  maxScore: 5,
  questionWeights: JSON.stringify(Array(10).fill(0.5)),
  correctAnswers: JSON.stringify(Array(10).fill('B')),
  createdAt: '2024-05-15T10:00:00.000Z',
  updatedAt: '2024-05-15T10:00:00.000Z',
};

const renderComponent = () =>
  render(<StudentAnswers evaluationId="eval-001" totalQuestions={10} onSave={() => {}} />);

describe('StudentAnswers - RF-8', () => {
  it('debe renderizar el componente de selección de estudiante RF-8', async () => {
    vi.spyOn(Database, 'selectStudentsByEvaluation').mockResolvedValue([]);
    vi.spyOn(Database, 'selectEvaluation').mockResolvedValue(null);
    renderComponent();
    expect(await screen.findByText('Seleccionar Estudiante y Respuestas')).toBeTruthy();
    expect(screen.getByText('Importar estudiantes')).toBeTruthy();
  });

  it('debe permitir importar estudiantes desde CSV', async () => {
    vi.spyOn(Database, 'selectStudentsByEvaluation').mockResolvedValue([]);
    vi.spyOn(Database, 'selectEvaluation').mockResolvedValue(null);
    renderComponent();
    expect(await screen.findByText('Importar estudiantes')).toBeTruthy();
  });

  it('debe mostrar el estudiante cargado con sus datos editables', async () => {
    vi.spyOn(Database, 'selectStudentsByEvaluation').mockResolvedValue([mockStudent]);
    vi.spyOn(Database, 'selectEvaluation').mockResolvedValue(mockEvaluation);
    renderComponent();
    expect(await screen.findByText('E001 — Maria Perez')).toBeTruthy();
    expect(screen.getByDisplayValue('E001')).toBeTruthy();
    expect(screen.getByDisplayValue('Maria Perez')).toBeTruthy();
  });

  it('debe llamar a onSave al guardar las respuestas', async () => {
    vi.spyOn(Database, 'selectStudentsByEvaluation').mockResolvedValue([mockStudent]);
    vi.spyOn(Database, 'selectEvaluation').mockResolvedValue(mockEvaluation);
    vi.spyOn(Database, 'updateStudentAnswers').mockResolvedValue();
    vi.spyOn(Database, 'updateStudent').mockResolvedValue();
    const onSave = vi.fn();
    render(<StudentAnswers evaluationId="eval-001" totalQuestions={10} onSave={onSave} />);
    const saveButton = await screen.findByText('Guardar respuestas');
    fireEvent.press(saveButton);
    expect(onSave).toHaveBeenCalled();
  });
});

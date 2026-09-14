import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { HistoryScreen } from '@/components/evaluation/history-screen';
import * as Database from '@/database';

const mockPush = vi.fn();

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

type MockEvaluation = Database.EvaluationRow & {
  studentCount: number;
  averageScore: number;
};

const mockEvaluations: MockEvaluation[] = [
  {
    id: 'eval-001',
    name: 'Matemáticas Basicas',
    date: '2024-05-15',
    academicPeriod: 'Primer Período',
    totalQuestions: 10,
    totalStudents: 30,
    gradingSystem: '0-to-max',
    maxScore: 5,
    questionWeights: '[1]',
    correctAnswers: '[]',
    createdAt: '2024-05-15T10:00:00.000Z',
    updatedAt: '2024-05-15T10:00:00.000Z',
    studentCount: 30,
    averageScore: 3.5,
  },
  {
    id: 'eval-002',
    name: 'Lenguaje y Comunicación',
    date: '2024-05-10',
    academicPeriod: 'Primer Período',
    totalQuestions: 10,
    totalStudents: 25,
    gradingSystem: '0-to-max',
    maxScore: 5,
    questionWeights: '[1]',
    correctAnswers: '[]',
    createdAt: '2024-05-10T10:00:00.000Z',
    updatedAt: '2024-05-10T10:00:00.000Z',
    studentCount: 25,
    averageScore: 4.2,
  },
  {
    id: 'eval-003',
    name: 'Ciencias Naturales',
    date: '2024-05-05',
    academicPeriod: 'Primer Período',
    totalQuestions: 10,
    totalStudents: 35,
    gradingSystem: '0-to-max',
    maxScore: 5,
    questionWeights: '[1]',
    correctAnswers: '[]',
    createdAt: '2024-05-05T10:00:00.000Z',
    updatedAt: '2024-05-05T10:00:00.000Z',
    studentCount: 35,
    averageScore: 2.8,
  },
];

beforeEach(() => {
  mockPush.mockClear();
  vi.spyOn(Database, 'getRecentEvaluationsWithStats').mockResolvedValue(mockEvaluations);
});

describe('HistoryScreen - RF-12 y RF-13', () => {
  it('debe renderizar el historial de evaluaciones RF-12', async () => {
    render(<HistoryScreen />);
    expect(await screen.findByText('Matemáticas Basicas')).toBeTruthy();
    expect(screen.getByText('Lenguaje y Comunicación')).toBeTruthy();
    expect(screen.getByText('Ciencias Naturales')).toBeTruthy();
  });

  it('debe mostrar exactamente las evaluaciones mockeadas', async () => {
    render(<HistoryScreen />);
    await screen.findByText('Matemáticas Basicas');
    expect(screen.getAllByText('Matemáticas Basicas').length).toBe(1);
  });

  it('debe exponer el buscador de evaluaciones RF-13', async () => {
    render(<HistoryScreen />);
    await screen.findByText('Matemáticas Basicas');
    expect(screen.getByPlaceholderText('Buscar evaluación...')).toBeTruthy();
  });

  it('debe navegar a una evaluación al hacer clic', async () => {
    render(<HistoryScreen />);
    const evaluationName = await screen.findByText('Matemáticas Basicas');
    fireEvent.press(evaluationName);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/history',
      params: { evaluationId: 'eval-001' },
    });
  });
});

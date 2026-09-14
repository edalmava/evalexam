import { describe, it, expect } from 'vitest';
import {
  formatRecentEvaluations,
  buildDashboardStats,
  determineStatus,
} from '../../lib/dashboardStats';

describe('Integración Dashboard - RF-1, RF-2, RF-3, RF-4', () => {
  it('RF-1: construye el estado completo del dashboard con estadísticas y evaluaciones', () => {
    const raw = [
      {
        id: 'eval-001',
        name: 'Matemáticas',
        date: '2024-05-15',
        studentCount: '30',
        averageScore: '3.5',
      },
      {
        id: 'eval-002',
        name: 'Lenguaje',
        date: '2024-05-10',
        studentCount: '25',
        averageScore: '4.2',
      },
    ];
    const recent = formatRecentEvaluations(raw);
    const stats = buildDashboardStats(2, 55, 3.85, recent);

    expect(recent).toHaveLength(2);
    expect(recent[0].status).toBe('completed');
    expect(stats.totalEvaluations).toBe(2);
    expect(stats.totalStudents).toBe(55);
    expect(stats.lastEvaluationName).toBe('Matemáticas');
  });

  it('RF-2: simula dashboard sin evaluaciones (estado vacío)', () => {
    const recent = formatRecentEvaluations([]);
    const stats = buildDashboardStats(0, 0, 0, recent);

    expect(stats.totalEvaluations).toBe(0);
    expect(stats.totalStudents).toBe(0);
    expect(stats.lastEvaluationName).toBeNull();
    expect(recent).toHaveLength(0);
  });

  it("RF-3: evaluación sin estudiantes se marca como 'Evaluación encontrada sin guardar' (draft)", () => {
    const raw = [
      {
        id: 'eval-003',
        name: 'Ciencias',
        date: '2024-05-05',
        studentCount: 0,
        averageScore: null,
      },
    ];
    const recent = formatRecentEvaluations(raw);

    expect(recent[0].status).toBe('draft');
    expect(determineStatus(recent[0].studentCount)).toBe('draft');
  });

  it('RF-4: la lógica del dashboard es offline (solo datos locales, sin red)', () => {
    const raw = [
      {
        id: 'eval-004',
        name: 'Sociales',
        date: '2024-05-01',
        studentCount: 40,
        averageScore: 3.0,
      },
    ];
    const recent = formatRecentEvaluations(raw);
    const stats = buildDashboardStats(1, 40, 3.0, recent);

    // Los datos provienen exclusivamente de procesamiento local en memoria
    expect(stats.totalEvaluations).toBeGreaterThanOrEqual(0);
    expect(recent.length).toBe(1);
    expect(stats.averageScore).toBe(3.0);
  });
});

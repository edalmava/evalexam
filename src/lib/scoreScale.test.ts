import { describe, expect, it } from 'vitest';
import {
  buildDistribution,
  classifyScore,
  DECREE_1290_BANDS,
  normalizeToReferenceScore,
  PerformanceBand,
  REFERENCE_MAX_SCORE,
} from './scoreScale';

const bandById = (id: string): PerformanceBand =>
  DECREE_1290_BANDS.find((band) => band.id === id)!;

describe('normalizeToReferenceScore', () => {
  it('0-to-max con maxScore 5 es identidad', () => {
    expect(normalizeToReferenceScore(0, '0-to-max', 5)).toBeCloseTo(0);
    expect(normalizeToReferenceScore(3, '0-to-max', 5)).toBeCloseTo(3);
    expect(normalizeToReferenceScore(4.5, '0-to-max', 5)).toBeCloseTo(4.5);
    expect(normalizeToReferenceScore(5, '0-to-max', 5)).toBeCloseTo(5);
  });

  it('0-to-max escala proporcional para maxScore ≠ 5', () => {
    expect(normalizeToReferenceScore(5, '0-to-max', 10)).toBeCloseTo(2.5);
    expect(normalizeToReferenceScore(10, '0-to-max', 10)).toBeCloseTo(5);
    expect(normalizeToReferenceScore(3, '0-to-max', 20)).toBeCloseTo(0.75);
  });

  it('1-to-max con maxScore 5 conserva la nota', () => {
    expect(normalizeToReferenceScore(1, '1-to-max', 5)).toBeCloseTo(1);
    expect(normalizeToReferenceScore(3, '1-to-max', 5)).toBeCloseTo(3);
    expect(normalizeToReferenceScore(5, '1-to-max', 5)).toBeCloseTo(5);
  });

  it('1-to-max mapea [1, max] al intervalo [1, 5]', () => {
    expect(normalizeToReferenceScore(1, '1-to-max', 10)).toBeCloseTo(1);
    expect(normalizeToReferenceScore(5.5, '1-to-max', 10)).toBeCloseTo(3);
    expect(normalizeToReferenceScore(10, '1-to-max', 10)).toBeCloseTo(5);
  });
});

describe('classifyScore (Decreto 1290)', () => {
  it('bordes inferiores', () => {
    expect(classifyScore(0).id).toBe('bajo');
    expect(classifyScore(2.99).id).toBe('bajo');
  });

  it('límite bajo → básico es inclusivo en 3.0', () => {
    expect(classifyScore(3).id).toBe('basico');
    expect(classifyScore(3.9).id).toBe('basico');
  });

  it('límite básico → alto es inclusivo en 4.0', () => {
    expect(classifyScore(4).id).toBe('alto');
    expect(classifyScore(4.5).id).toBe('alto');
  });

  it('alto → superior es estrictamente mayor de 4.5', () => {
    expect(classifyScore(4.51).id).toBe('superior');
    expect(classifyScore(5).id).toBe('superior');
  });

  it('tolera ruido de punto flotante en los bordes', () => {
    expect(classifyScore(3 - 0.5e-9).id).toBe('basico');
    expect(classifyScore(4 - 0.5e-9).id).toBe('alto');
    expect(classifyScore(4.5 + 0.5e-9).id).toBe('alto');
  });

  it('clasifica notas normalizadas desde otros maxScore', () => {
    expect(classifyScore(normalizeToReferenceScore(3, '0-to-max', 5)).id).toBe('basico');
    expect(classifyScore(normalizeToReferenceScore(9, '0-to-max', 10)).id).toBe('alto');
    expect(classifyScore(normalizeToReferenceScore(9.5, '1-to-max', 10)).id).toBe('superior');
  });

  it('respeta bandas personalizadas (configuración futura)', () => {
    const customBands: PerformanceBand[] = [
      { ...bandById('bajo'), min: 0, max: 4, maxInclusive: false, label: 'Bajo (institucional)' },
      { ...bandById('basico'), min: 4, minInclusive: true, max: 5, maxInclusive: true },
    ];
    expect(classifyScore(3.5, customBands).label).toBe('Bajo (institucional)');
    expect(classifyScore(4.5, customBands).label).toBe('Desempeño básico');
  });
});

describe('buildDistribution', () => {
  it('cuenta estudiantes por banda con bordes correctos', () => {
    const distribution = buildDistribution([2.9, 3, 3.9, 4, 4.5, 4.51], '0-to-max', 5);

    expect(distribution).toHaveLength(4);
    expect(distribution.find((d) => d.band.id === 'bajo')!.count).toBe(1);
    expect(distribution.find((d) => d.band.id === 'basico')!.count).toBe(2);
    expect(distribution.find((d) => d.band.id === 'alto')!.count).toBe(2);
    expect(distribution.find((d) => d.band.id === 'superior')!.count).toBe(1);
  });

  it('lista vacía produce ceros', () => {
    const distribution = buildDistribution([], '0-to-max', 5);
    expect(distribution.every((d) => d.count === 0)).toBe(true);
  });

  it('normaliza con maxScore ≠ 5 antes de contar', () => {
    // 3→1.5 (bajo), 7→3.5 (básico), 8→4 (alto), 9→4.5 (alto), 10→5 (superior)
    const distribution = buildDistribution([3, 7, 8, 9, 10], '0-to-max', 10);
    expect(distribution.find((d) => d.band.id === 'bajo')!.count).toBe(1);
    expect(distribution.find((d) => d.band.id === 'basico')!.count).toBe(1);
    expect(distribution.find((d) => d.band.id === 'alto')!.count).toBe(2);
    expect(distribution.find((d) => d.band.id === 'superior')!.count).toBe(1);
  });

  it('mantiene la escala de referencia 0–5', () => {
    expect(REFERENCE_MAX_SCORE).toBe(5);
    expect(DECREE_1290_BANDS[0].min).toBe(0);
    expect(DECREE_1290_BANDS[3].max).toBe(5);
  });
});
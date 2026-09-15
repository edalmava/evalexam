/**
 * Escala de valoración por desempeño según el Decreto 1290 de 2009.
 *
 * Los niveles y umbrales se definen sobre una escala de referencia 0–5. En
 * futuras actualizaciones estos valores podrán modificarse desde una opción de
 * Configuración; por ahora son los valores por defecto del decreto (única
 * fuente de verdad, módulo puro).
 */

export type PerformanceTone = 'danger' | 'warning' | 'success';

export interface PerformanceBand {
  id: string;
  /** Nombre del nivel de desempeño (UI). */
  label: string;
  /** Descripción del rango para mostrar (UI). */
  rangeLabel: string;
  /** Límite inferior en la escala de referencia 0–5. */
  min: number;
  minInclusive: boolean;
  /** Límite superior en la escala de referencia 0–5. */
  max: number;
  maxInclusive: boolean;
  /** Tono semántico: mapea a los tokens del tema (danger/warning/success). */
  tone: PerformanceTone;
}

export const REFERENCE_MAX_SCORE = 5;

const EPSILON = 1e-9;

/** Valores por defecto del Decreto 1290 (configurables en el futuro). */
export const DECREE_1290_BANDS: readonly PerformanceBand[] = [
  {
    id: 'bajo',
    label: 'Desempeño bajo',
    rangeLabel: 'Menor a 3.0',
    min: 0,
    minInclusive: true,
    max: 3,
    maxInclusive: false,
    tone: 'danger',
  },
  {
    id: 'basico',
    label: 'Desempeño básico',
    rangeLabel: '3.0 a 3.9',
    min: 3,
    minInclusive: true,
    max: 4,
    maxInclusive: false,
    tone: 'warning',
  },
  {
    id: 'alto',
    label: 'Desempeño alto',
    rangeLabel: '4.0 a 4.5',
    min: 4,
    minInclusive: true,
    max: 4.5,
    maxInclusive: true,
    tone: 'success',
  },
  {
    id: 'superior',
    label: 'Desempeño superior',
    rangeLabel: 'Mayor a 4.5',
    min: 4.5,
    minInclusive: false,
    max: REFERENCE_MAX_SCORE,
    maxInclusive: true,
    tone: 'success',
  },
];

/**
 * Lleva una nota del sistema configurable (0-a-max / 1-a-max) a la escala de
 * referencia 0–5 para poder clasificarla con los umbrales del Decreto 1290.
 */
export const normalizeToReferenceScore = (
  score: number,
  gradingSystem: string,
  maxScore: number,
): number => {
  const max = Math.max(maxScore, EPSILON);
  if (gradingSystem === '1-to-max') {
    const span = Math.max(max - 1, EPSILON);
    return 1 + ((score - 1) * (REFERENCE_MAX_SCORE - 1)) / span;
  }
  return (score * REFERENCE_MAX_SCORE) / max;
};

/**
 * Clasifica una nota ya normalizada (escala 0–5) en su banda de desempeño.
 * Los límites se comparan con épsilon para tolerar ruido de punto flotante.
 */
export const classifyScore = (
  normalizedScore: number,
  bands: readonly PerformanceBand[] = DECREE_1290_BANDS,
): PerformanceBand => {
  const match = bands.find((band) => {
    const aboveMin = band.minInclusive
      ? normalizedScore >= band.min - EPSILON
      : normalizedScore > band.min + EPSILON;
    const belowMax = band.maxInclusive
      ? normalizedScore <= band.max + EPSILON
      : normalizedScore < band.max - EPSILON;
    return aboveMin && belowMax;
  });
  if (match) return match;
  return normalizedScore < (bands[0]?.min ?? 0) ? bands[0] : bands[bands.length - 1];
};

export interface BandCount {
  band: PerformanceBand;
  count: number;
}

/** Cuenta cuántos estudiantes caen en cada banda de desempeño. */
export const buildDistribution = (
  scores: readonly number[],
  gradingSystem: string,
  maxScore: number,
  bands: readonly PerformanceBand[] = DECREE_1290_BANDS,
): BandCount[] =>
  bands.map((band) => ({
    band,
    count: scores.filter(
      (score) =>
        classifyScore(normalizeToReferenceScore(score, gradingSystem, maxScore), bands).id ===
        band.id,
    ).length,
  }));
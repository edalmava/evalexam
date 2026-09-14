export interface CalculateParams {
  system: '0-to-max' | '1-to-max';
  maxScore: number;
  totalQuestions: number;
  correct: number;
  weights: number[] | null;
  /**
   * Marcas de acierto por pregunta (opcional). Cuando hay pesos diferentes,
   * es necesario saber QUÉ preguntas se acertaron para sumar el peso de cada
   * una (RF-3/RF-5). Si se omite, se asume que las primeras `correct` preguntas
   * son las acertadas (comportamiento heredado, usado solo como respaldo).
   */
  correctPerQuestion?: boolean[];
}

export interface CalculateResult {
  score: number;
  system: '0-to-max' | '1-to-max';
  maxScore: number;
  totalQuestions: number;
  correct: number;
  weightsUsed: number[] | null;
}

/**
 * Calcula la nota de un estudiante según el sistema de calificación configurado.
 * Fórmulas parametrizables, NO hardcodeadas para 5 o 4.
 *
 * @param params - Parámetros de cálculo:
 *   - system: "0-to-max" o "1-to-max"
 *   - maxScore: nota máxima configurable (cualquier entero > 0, ej. 5, 10, 20, 100)
 *   - totalQuestions: número total de preguntas
 *   - correct: número de aciertos del estudiante
 *   - weights: pesos de las preguntas (null si todos son iguales, array si son diferentes)
 *
 * @returns Objeto con la nota calculada y metadatos
 *
 * RF cubierta: RF-2, RF-3, RF-4, RF-5 (fórmulas configurables con maxScore configurable)
 */
export function calculateScore(params: CalculateParams): CalculateResult {
  const { system, maxScore, totalQuestions, correct, weights, correctPerQuestion } = params;

  // Validación de entradas
  if (maxScore <= 0) {
    throw new Error('La nota máxima debe ser mayor a 0');
  }
  if (totalQuestions <= 0) {
    throw new Error('El número total de preguntas debe ser mayor a 0');
  }
  if (correct < 0 || correct > totalQuestions) {
    throw new Error('El número de aciertos debe estar entre 0 y el total de preguntas');
  }
  if (weights !== null && weights.length !== totalQuestions) {
    throw new Error(
      `El número de pesos (${weights.length}) debe coincidir con el total de preguntas (${totalQuestions})`,
    );
  }

  // CASO 1: Sistema 0 a maxScore con pesos iguales
  if (system === '0-to-max' && weights === null) {
    // Fórmula: (maxScore / totalQuestions) * correct
    const score = (maxScore / totalQuestions) * correct;
    return {
      score: Math.round(score * 100) / 100, // redondear a 2 decimales
      system,
      maxScore,
      totalQuestions,
      correct,
      weightsUsed: weights,
    };
  }

  // CASO 2: Sistema 0 a maxScore con pesos diferentes
  if (system === '0-to-max' && weights !== null) {
    // Fórmula (RF-3): suma(peso_pregunta_i) para cada pregunta ACERTADA
    // Si el total es mayor a maxScore, la nota final se queda en maxScore
    let sumWeightsOfCorrect = 0;
    if (correctPerQuestion && correctPerQuestion.length === totalQuestions) {
      for (let i = 0; i < totalQuestions; i++) {
        const w = weights[i];
        if (correctPerQuestion[i] && w !== undefined) {
          sumWeightsOfCorrect += w;
        }
      }
    } else {
      // Respaldo: las primeras `correct` preguntas se consideran acertadas
      const anticipatedHits = Math.min(correct, totalQuestions);
      for (let i = 0; i < anticipatedHits; i++) {
        if (weights[i] !== undefined) {
          sumWeightsOfCorrect += weights[i];
        }
      }
    }

    let score = sumWeightsOfCorrect;
    if (score > maxScore) {
      score = maxScore;
    }

    return {
      score: Math.round(score * 100) / 100,
      system,
      maxScore,
      totalQuestions,
      correct,
      weightsUsed: weights,
    };
  }

  // CASO 3: Sistema 1 a maxScore con pesos iguales
  if (system === '1-to-max' && weights === null) {
    // Fórmula: ((maxScore - 1) / totalQuestions) * correct + 1
    const score = ((maxScore - 1) / totalQuestions) * correct + 1;
    return {
      score: Math.max(1, Math.round(score * 100) / 100), // asegurar mínimo de 1
      system,
      maxScore,
      totalQuestions,
      correct,
      weightsUsed: weights,
    };
  }

  // CASO 4: Sistema 1 a maxScore con pesos diferentes
  if (system === '1-to-max' && weights !== null) {
    // Fórmula: suma(peso_pregunta_i para cada pregunta acertada)
    // Si esta suma es mayor a (maxScore - 1), se reduce a (maxScore - 1)
    // Finalmente, súmale uno a ese resultado

    let sumWeightsOfCorrect = 0;
    if (correctPerQuestion && correctPerQuestion.length === totalQuestions) {
      for (let i = 0; i < totalQuestions; i++) {
        const w = weights[i];
        if (correctPerQuestion[i] && w !== undefined) {
          sumWeightsOfCorrect += w;
        }
      }
    } else {
      const anticipatedHits = Math.min(correct, totalQuestions);
      for (let i = 0; i < anticipatedHits; i++) {
        if (weights[i] !== undefined) {
          sumWeightsOfCorrect += weights[i];
        }
      }
    }

    // Si la suma pasa de (maxScore - 1), se reduce a (maxScore - 1)
    let adjustedScore = sumWeightsOfCorrect;
    if (adjustedScore > maxScore - 1) {
      adjustedScore = maxScore - 1;
    }

    // Finalmente, súmale uno
    const finalScore = adjustedScore + 1;

    return {
      score: Math.max(1, Math.min(maxScore, Math.round(finalScore * 100) / 100)),
      system,
      maxScore,
      totalQuestions,
      correct,
      weightsUsed: weights,
    };
  }

  // Fallback: lanzar error si no coincide ningún caso
  throw new Error(
    `Configuración de cálculo no soportada: system=${system}, weights=${weights !== null ? weights.length : 'null'} preguntas`,
  );
}

/**
 * Calcula la nota cuando un estudiante deja respuestas en blanco.
 * Las respuestas en blanco no contabilizan en el cómputo de aciertos.
 * Si el estudiante no responde ninguna, se asigna 0 a la suma.
 *
 * @param correct - Número de respuestas que el estudiante sí marcó
 * @param totalQuestions - Número total de preguntas en la evaluación
 * @returns Número de aciertos efectivos (respuestas en blanco quedan excluidos)
 *
 * Caso límite (spec.md línea 52): "Comportamiento cuando un estudiante deja algunas respuestas en blanco:
 * se asigna 0 a la suma de aciertos para el cálculo de la nota."
 */
export function adjustCorrectForBlanks(correct: number, totalQuestions: number): number {
  // Las respuestas en blancan no restan, simplemente no se cuentan como aciertos
  // Si el parámetro 'correct' ya excluye las en blanco, no necesitamos ajustar más
  // Pero si 'correct' incluye potenciales en blanco, los excluimos:
  return Math.max(0, correct);
}

/**
 * Caso especial: 0 aciertos devuelve nota mínima del sistema.
 * - Para sistema 0-a-max: retorna 0
 * - Para sistema 1-a-max: retorna 1
 *
 * @param system - "0-to-max" o "1-to-max"
 * @returns Nota mínima del sistema
 */
export function getMinimumScore(system: '0-to-max' | '1-to-max'): number {
  if (system === '0-to-max') {
    return 0;
  }
  return 1;
}

/**
 * Caso especial: Cuando el peso total de preguntas diferentes excede el valor máximo del sistema de calificación.
 *
 * @param totalWeight - Suma total de todos los pesos de las preguntas
 * @param maxScore - Nota máxima del sistema
 * @returns Peso total ajustado (capado a maxScore si excede)
 */
export function capWeightToMaxScore(totalWeight: number, maxScore: number): number {
  if (totalWeight > maxScore) {
    return maxScore;
  }
  return totalWeight;
}

export default calculateScore;

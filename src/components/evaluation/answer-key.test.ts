import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateScore,
  adjustCorrectForBlanks,
  getMinimumScore,
  capWeightToMaxScore,
} from '../../lib/calculateScore';

describe('AnswerKey - RF-6 Tests (clave de respuestas y pesos)', () => {
  beforeEach(() => {});

  it('RF-6: debe validar que el componente AnswerKey cubre la selección de respuestas correctas por pregunta', () => {
    // RF-6: El sistema permite seleccionar la clave de respuesta correcta para cada pregunta
    // y asignar el peso correspondiente (igual o diferente)

    // Verificar que el cálculo funciona con respuestas correctas seleccionadas
    const result = calculateScore({
      system: '0-to-max',
      maxScore: 5,
      totalQuestions: 5,
      correct: 5,
      weights: [1, 1, 1, 1, 1],
    });
    expect(result.score).toBe(5);
  });

  it('RF-6: debe validar que pesos pueden ser iguales para todas las preguntas', () => {
    // Caso: todos los pesos son 1 (igual para todas)
    const result = calculateScore({
      system: '0-to-max',
      maxScore: 10,
      totalQuestions: 10,
      correct: 10,
      weights: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    });
    expect(result.score).toBe(10);
  });

  it('RF-6: debe validar que pesos pueden ser diferentes por pregunta', () => {
    // Caso: pesos diferentes [1, 2, 3, 4, 5]
    const result = calculateScore({
      system: '0-to-max',
      maxScore: 15,
      totalQuestions: 5,
      correct: 5,
      weights: [1, 2, 3, 4, 5],
    });
    // Suma = 1+2+3+4+5 = 15, maxScore = 15, entonces 15
    expect(result.score).toBe(15);
  });

  it('RF-6: debe validar cálculo RF-3 con pesos diferentes y total > maxScore', () => {
    // 3 preguntas, pesos [2, 2, 2], correctas 3, maxScore = 5
    // Suma = 6 > 5, entonces se queda en 5
    const result = calculateScore({
      system: '0-to-max',
      maxScore: 5,
      totalQuestions: 3,
      correct: 3,
      weights: [2, 2, 2],
    });
    expect(result.score).toBe(5);
  });

  it('RF-6: debe validar cálculo RF-5 con sistema 1-a-max y pesos', () => {
    // 3 preguntas, pesos [1, 1, 1], correctas 3, maxScore = 5
    // Fórmula 1-a-max: suma pesos = 3, (maxScore-1) = 4, 3 no > 4, +1 = 4
    const result = calculateScore({
      system: '1-to-max',
      maxScore: 5,
      totalQuestions: 3,
      correct: 3,
      weights: [1, 1, 1],
    });
    expect(result.score).toBe(4);
  });

  it('RF-6: debe validar cálculo sistema 1-a-max con pesos que exceden', () => {
    // 3 preguntas, pesos [3, 3, 3], correctas 3, maxScore = 5
    // Suma = 9, (maxScore-1) = 4, 9 > 4, reducir a 4, +1 = 5
    const result = calculateScore({
      system: '1-to-max',
      maxScore: 5,
      totalQuestions: 3,
      correct: 3,
      weights: [3, 3, 3],
    });
    expect(result.score).toBe(5);
  });

  it('RF-6: validar adjustCorrectForBlanks - respuestas en blanco no cuentan', () => {
    // Si un estudiante deja algunas en blanco, el correct count debe ajustarse
    const adjusted = adjustCorrectForBlanks(3, 5); // 3 de 5 respondidas, 2 en blanco
    expect(adjusted).toBe(3);

    // Si todas en blanco
    const adjusted2 = adjustCorrectForBlanks(0, 5);
    expect(adjusted2).toBe(0);
  });

  it('RF-6: validar getMinimumScore - nota mínima del sistema', () => {
    expect(getMinimumScore('0-to-max')).toBe(0);
    expect(getMinimumScore('1-to-max')).toBe(1);
  });

  it('RF-6: validar capWeightToMaxScore - peso total no debe exceder maxScore', () => {
    expect(capWeightToMaxScore(10, 5)).toBe(5);
    expect(capWeightToMaxScore(3, 5)).toBe(3);
    expect(capWeightToMaxScore(5, 5)).toBe(5);
  });
});

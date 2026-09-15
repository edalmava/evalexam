import { describe, it, expect } from 'vitest';
import {
  ScanError,
  validateScanResponse,
  mapScanResponseToAnswers,
  collectScanWarnings,
  ScanAnswerSheetResponse,
} from './scanAnswerSheet';

describe('validateScanResponse', () => {
  it('acepta una respuesta válida y normaliza a mayúsculas', () => {
    const result = validateScanResponse(
      { answers: ['A', 'b', null, 'D'], warnings: ['Pregunta 3 ilegible'] },
      4,
    );
    expect(result.answers).toEqual(['A', 'B', null, 'D']);
    expect(result.warnings).toEqual(['Pregunta 3 ilegible']);
  });

  it('trata strings vacíos y espacios en blanco como null', () => {
    const result = validateScanResponse({ answers: ['A', '', '   ', null] }, 4);
    expect(result.answers).toEqual(['A', null, null, null]);
  });

  it('rechaza respuestas no-array con PARSE_ERROR', () => {
    expect(() => validateScanResponse({ answers: 'ABCD' }, 4)).toThrow(ScanError);
    expect(() => validateScanResponse({ answers: 'ABCD' }, 4)).toThrow(/respuestas/);
  });

  it('rechaza arreglos vacíos con PARSE_ERROR', () => {
    expect(() => validateScanResponse({ answers: [] }, 4)).toThrow(ScanError);
  });

  it('rechaza elementos con tipo inválido', () => {
    expect(() => validateScanResponse({ answers: ['A', 42] }, 4)).toThrow(/tipo inválido/);
  });

  it('rechaza respuestas fuera de las opciones válidas', () => {
    expect(() => validateScanResponse({ answers: ['E'] }, 1)).toThrow(/fuera de las opciones/);
    expect(() => validateScanResponse({ answers: ['E'] }, 1, ['A', 'B', 'C', 'D'])).toThrow();
  });

  it('rechaza totalQuestions inválidos', () => {
    expect(() => validateScanResponse({ answers: ['A'] }, 0)).toThrow(ScanError);
  });

  it('filtra warnings no string', () => {
    const result = validateScanResponse({ answers: ['A'], warnings: ['ok', 5, null] }, 1);
    expect(result.warnings).toEqual(['ok']);
  });
});

describe('mapScanResponseToAnswers', () => {
  it('mapea null a string vacío', () => {
    const response: ScanAnswerSheetResponse = { answers: ['A', null, 'C'] };
    expect(mapScanResponseToAnswers(response, 3)).toEqual(['A', '', 'C']);
  });

  it('completa con string vacío si faltan respuestas', () => {
    const response: ScanAnswerSheetResponse = { answers: ['A', 'B'] };
    expect(mapScanResponseToAnswers(response, 5)).toEqual(['A', 'B', '', '', '']);
  });

  it('trunca si sobran respuestas', () => {
    const response: ScanAnswerSheetResponse = { answers: ['A', 'B', 'C', 'D', 'A'] };
    expect(mapScanResponseToAnswers(response, 3)).toEqual(['A', 'B', 'C']);
  });

  it('descarta opciones inválidas en el mapeo final', () => {
    const response: ScanAnswerSheetResponse = { answers: ['A', 'Z' as string | null, 'B'] };
    expect(mapScanResponseToAnswers(response, 3)).toEqual(['A', '', 'B']);
  });

  it('respeta opciones custom', () => {
    const response: ScanAnswerSheetResponse = { answers: ['A', 'B', 'C', 'D', 'E'] };
    const options = ['A', 'B', 'C', 'D', 'E'];
    expect(mapScanResponseToAnswers(response, 5, options)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
});

describe('collectScanWarnings', () => {
  it('combina warnings del backend y los locales', () => {
    const response: ScanAnswerSheetResponse = {
      answers: ['A', null],
      warnings: ['Pregunta 2 ilegible'],
    };
    expect(collectScanWarnings(response, 3)).toEqual([
      'Pregunta 2 ilegible',
      'Solo se detectaron 1 de 3 preguntas',
    ]);
  });

  it('advierte cuando llegan más respuestas de las esperadas', () => {
    const response: ScanAnswerSheetResponse = { answers: ['A', 'B', 'C', 'D'], warnings: [] };
    expect(collectScanWarnings(response, 2)).toContain(
      'Se recibieron 4 respuestas y se usaron las primeras 2',
    );
  });
});

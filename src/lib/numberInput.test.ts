import { describe, it, expect } from 'vitest';
import {
  sanitizeIntegerText,
  sanitizeDecimalText,
  parseIntegerText,
  parseDecimalText,
  resolveWeightTexts,
} from './numberInput';

describe('sanitizeIntegerText', () => {
  it('conserva solo dígitos', () => {
    expect(sanitizeIntegerText('12a3-4.')).toBe('1234');
    expect(sanitizeIntegerText('')).toBe('');
  });
});

describe('sanitizeDecimalText', () => {
  it('conserva dígitos y un único punto', () => {
    expect(sanitizeDecimalText('2.5')).toBe('2.5');
    expect(sanitizeDecimalText('1.')).toBe('1.');
    expect(sanitizeDecimalText('1.2.3')).toBe('1.23');
    expect(sanitizeDecimalText('a1b.c')).toBe('1.');
    expect(sanitizeDecimalText('')).toBe('');
  });
});

describe('parseIntegerText', () => {
  it('parsea enteros positivos y aplica fallback al resto', () => {
    expect(parseIntegerText('20', 5)).toBe(20);
    expect(parseIntegerText('', 5)).toBe(5);
    expect(parseIntegerText('abc', 5)).toBe(5);
    expect(parseIntegerText('0', 5)).toBe(5);
    expect(parseIntegerText('-3', 5)).toBe(5);
  });
});

describe('parseDecimalText', () => {
  it('parsea decimales positivos y aplica fallback al resto', () => {
    expect(parseDecimalText('2.5', 1)).toBe(2.5);
    expect(parseDecimalText('1.', 1)).toBe(1);
    expect(parseDecimalText('', 1)).toBe(1);
    expect(parseDecimalText('.', 1)).toBe(1);
    expect(parseDecimalText('0', 1)).toBe(1);
    expect(parseDecimalText('-1.5', 1)).toBe(1);
  });
});

describe('resolveWeightTexts', () => {
  it('rellena con defaultText los índices faltantes', () => {
    expect(resolveWeightTexts(['1', '2'], 4, '0.5')).toEqual(['1', '2', '0.5', '0.5']);
  });

  it('trunca si totalQuestions es menor a la lista', () => {
    expect(resolveWeightTexts(['1', '2', '3'], 2, '0.5')).toEqual(['1', '2']);
  });

  it('devuelve array vacío si totalQuestions es 0 o negativo', () => {
    expect(resolveWeightTexts(['1', '2'], 0, '0.5')).toEqual([]);
    expect(resolveWeightTexts(['1', '2'], -3, '0.5')).toEqual([]);
  });

  it('conserva strings vacíos escritos por el usuario', () => {
    expect(resolveWeightTexts(['', '2'], 3, '0.5')).toEqual(['', '2', '0.5']);
  });
});

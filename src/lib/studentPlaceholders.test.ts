import { describe, it, expect } from 'vitest';
import { buildStudentPlaceholders } from './studentPlaceholders';

describe('buildStudentPlaceholders', () => {
  it('genera códigos E001…E0N y nombres Estudiante 1…N', () => {
    const placeholders = buildStudentPlaceholders(3);
    expect(placeholders).toEqual([
      { code: 'E001', name: 'Estudiante 1' },
      { code: 'E002', name: 'Estudiante 2' },
      { code: 'E003', name: 'Estudiante 3' },
    ]);
  });

  it('usa cero-padding de 3 dígitos pasado el 999', () => {
    const placeholders = buildStudentPlaceholders(1001);
    expect(placeholders[999].code).toBe('E1000');
    expect(placeholders[1000].code).toBe('E1001');
  });

  it('devuelve [] si count <= 0', () => {
    expect(buildStudentPlaceholders(0)).toEqual([]);
    expect(buildStudentPlaceholders(-5)).toEqual([]);
  });

  it('devuelve [] si count no es un número finito', () => {
    expect(buildStudentPlaceholders(NaN)).toEqual([]);
    expect(buildStudentPlaceholders(Infinity)).toEqual([]);
  });

  it('trunca decimales (count se trata como entero)', () => {
    const placeholders = buildStudentPlaceholders(2.9);
    expect(placeholders).toHaveLength(2);
  });
});

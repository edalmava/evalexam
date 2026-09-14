export interface StudentPlaceholder {
  code: string;
  name: string;
}

/**
 * Genera placeholders de estudiantes para pre-poblar el paso "Respuestas de Estudiantes".
 *
 * RF-1: el número de estudiantes configurado en el paso 1 debe tener efecto en el flujo;
 * si la evaluación no tiene estudiantes y totalStudents > 0, se crean esas filas.
 *
 * @param count - Número de estudiantes a generar (totalStudents)
 * @returns Arreglo con códigos E001…E0N y nombres "Estudiante 1…N"; [] si count <= 0
 */
export function buildStudentPlaceholders(count: number): StudentPlaceholder[] {
  if (!Number.isFinite(count) || count <= 0) {
    return [];
  }

  const total = Math.floor(count);
  return Array.from({ length: total }, (_, index) => ({
    code: `E${String(index + 1).padStart(3, '0')}`,
    name: `Estudiante ${index + 1}`,
  }));
}

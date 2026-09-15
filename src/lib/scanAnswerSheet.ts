export type ScanErrorCode =
  'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_IMAGE' | 'PARSE_ERROR' | 'RATE_LIMITED' | 'UPSTREAM_ERROR';

export class ScanError extends Error {
  readonly code: ScanErrorCode;

  constructor(code: ScanErrorCode, message: string) {
    super(message);
    this.name = 'ScanError';
    this.code = code;
  }
}

export interface ScanAnswerSheetRequest {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png';
  totalQuestions: number;
  columns?: 1 | 2 | 3;
  options?: string[];
}

export interface ScanAnswerSheetResponse {
  answers: (string | null)[]; // null = no se pudo determinar / en blanco
  warnings?: string[];
}

export const DEFAULT_OPTIONS = ['A', 'B', 'C', 'D'];

/**
 * Valida el JSON crudo devuelto por el backend (que a su vez viene de Gemini).
 * Rechaza con ScanError(PARSE_ERROR) cualquier forma inválida; no lanza por
 * discrepancias de longitud (se normalizan en mapScanResponseToAnswers).
 */
export function validateScanResponse(
  raw: unknown,
  totalQuestions: number,
  options: string[] = DEFAULT_OPTIONS,
): ScanAnswerSheetResponse {
  if (totalQuestions <= 0) {
    throw new ScanError('PARSE_ERROR', 'totalQuestions debe ser mayor a 0');
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ScanError('PARSE_ERROR', 'La respuesta del escaneo no es un objeto JSON válido');
  }

  const body = raw as { answers?: unknown; warnings?: unknown };
  if (!Array.isArray(body.answers) || body.answers.length === 0) {
    throw new ScanError('PARSE_ERROR', 'La respuesta del escaneo no contiene respuestas');
  }

  const normalized: (string | null)[] = body.answers.map((answer) => {
    if (answer === null || (typeof answer === 'string' && answer.trim() === '')) {
      return null;
    }
    if (typeof answer !== 'string') {
      throw new ScanError('PARSE_ERROR', `Respuesta con tipo inválido: ${String(answer)}`);
    }
    const uppercased = answer.toUpperCase();
    if (!options.includes(uppercased)) {
      throw new ScanError('PARSE_ERROR', `Respuesta fuera de las opciones válidas: "${answer}"`);
    }
    return uppercased;
  });

  const warnings = Array.isArray(body.warnings)
    ? body.warnings.filter((warning): warning is string => typeof warning === 'string')
    : [];

  return { answers: normalized, warnings };
}

/**
 * Mapea la respuesta validada al arreglo final de respuestas para persistir.
 * - null/undefined → '' (en blanco; el contrato de `students.answers` es string[]).
 * - Si hay más respuestas que totalQuestions, se trunca.
 * - Si hay menos, se completa con ''.
 */
export function mapScanResponseToAnswers(
  response: ScanAnswerSheetResponse,
  totalQuestions: number,
  options: string[] = DEFAULT_OPTIONS,
): string[] {
  const result: string[] = response.answers.slice(0, totalQuestions).map((answer) => {
    if (answer === null || answer === undefined) return '';
    const uppercased = answer.toUpperCase();
    return options.includes(uppercased) ? uppercased : '';
  });
  while (result.length < totalQuestions) {
    result.push('');
  }
  return result;
}

/** Advertencias combinadas: las del backend más las derivadas del mapeo local. */
export function collectScanWarnings(
  response: ScanAnswerSheetResponse,
  totalQuestions: number,
): string[] {
  const warnings = [...(response.warnings ?? [])];
  const detected = response.answers.filter((a) => a !== null && a !== undefined).length;
  if (detected < totalQuestions) {
    warnings.push(`Solo se detectaron ${detected} de ${totalQuestions} preguntas`);
  }
  if (response.answers.length > totalQuestions) {
    warnings.push(
      `Se recibieron ${response.answers.length} respuestas y se usaron las primeras ${totalQuestions}`,
    );
  }
  return warnings;
}

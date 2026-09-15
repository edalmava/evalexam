import { ScanError, validateScanResponse } from '../../../src/lib/scanAnswerSheet.js';

/**
 * Valida el JSON crudo devuelto por Gemini (comparte la misma lógica pura que
 * la app: `src/lib/scanAnswerSheet.ts`). Re-exporta para uso del router.
 */
export { ScanError };

export const validateGeminiResponse = (raw: unknown, totalQuestions: number, options?: string[]) =>
  validateScanResponse(raw, totalQuestions, options);

export const isScanError = (error: unknown): error is ScanError => error instanceof ScanError;

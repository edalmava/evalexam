import {
  ScanAnswerSheetRequest,
  ScanAnswerSheetResponse,
  ScanError,
  validateScanResponse,
} from './scanAnswerSheet';

/**
 * URL del backend proxy. Estrategia: solo la URL se expone en la app vía
 * EXPO_PUBLIC_SCAN_API_URL (no es un secreto); la API key de Gemini vive en el
 * servidor (ver `server/` y docs/scan-backend.md).
 */
export const getScanApiUrl = (): string =>
  process.env.EXPO_PUBLIC_SCAN_API_URL ?? 'http://localhost:8787';

export const DEFAULT_SCAN_TIMEOUT_MS = 60000;

const parseJsonMessage = (text: string): string | null => {
  try {
    const parsed = JSON.parse(text) as { message?: unknown };
    return typeof parsed.message === 'string' && parsed.message.length > 0
      ? parsed.message
      : null;
  } catch {
    return null;
  }
};

/**
 * Envía la imagen (Base64) al backend propio y valida la respuesta.
 * Nunca aporta credenciales de Gemini: solo conoce el endpoint.
 */
export const scanAnswerSheet = async (
  request: ScanAnswerSheetRequest,
  timeoutMs: number = DEFAULT_SCAN_TIMEOUT_MS,
): Promise<ScanAnswerSheetResponse> => {
  if (!request.imageBase64 || request.imageBase64.length === 0) {
    throw new ScanError('INVALID_IMAGE', 'La imagen capturada está vacía');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getScanApiUrl()}/scan-answer-sheet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    const text = await response.text();

    if (response.status === 429) {
      throw new ScanError(
        'RATE_LIMITED',
        parseJsonMessage(text) ?? 'El servicio está saturado. Intenta de nuevo en unos minutos.',
      );
    }

    if (!response.ok) {
      throw new ScanError(
        'UPSTREAM_ERROR',
        parseJsonMessage(text) ?? `El servicio respondió con estado ${response.status}`,
      );
    }

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new ScanError('PARSE_ERROR', 'El backend no devolvió un JSON válido');
    }

    return validateScanResponse(raw, request.totalQuestions, request.options);
  } catch (error) {
    if (error instanceof ScanError) {
      throw error;
    }
    if (error instanceof Error && (error.name === 'AbortError' || controller.signal.aborted)) {
      throw new ScanError(
        'TIMEOUT',
        'El escaneo tardó demasiado. Revisa tu conexión e inténtalo de nuevo.',
      );
    }
    throw new ScanError(
      'NETWORK_ERROR',
      `No se pudo conectar con el servicio de escaneo. Verifica que ${getScanApiUrl()} sea accesible desde este dispositivo.`,
    );
  } finally {
    clearTimeout(timer);
  }
};

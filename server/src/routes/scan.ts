import { GoogleGenerativeAI } from '@google/generative-ai';
import { Router } from 'express';
import { ScanError } from '../lib/validate.js';
import { validateGeminiResponse } from '../lib/validate.js';
import { buildScanPrompt } from '../lib/prompt.js';

interface ScanRequestBody {
  imageBase64?: unknown;
  mimeType?: unknown;
  totalQuestions?: unknown;
  columns?: unknown;
  options?: unknown;
}

const MAX_TOTAL_QUESTIONS = 200;
const MAX_IMAGE_BASE64_LENGTH = 25_000_000;

const getGenAIModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ScanError('UPSTREAM_ERROR', 'GEMINI_API_KEY no está configurada en el servidor');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = process.env.GEMINI_MODEL ?? 'gemini-3.6-flash';
  return genAI.getGenerativeModel({
    model,
    generationConfig: { responseMimeType: 'application/json' },
  });
};

export const scanRouter = Router();

scanRouter.post('/scan-answer-sheet', async (req, res) => {
  const body = (req.body ?? {}) as ScanRequestBody;

  // 1) Validar entrada (RNF seguridad/tamaño).
  const imageBase64 = body.imageBase64;
  const mimeType = body.mimeType;
  const totalQuestions = body.totalQuestions;
  const columns = body.columns;
  const options = body.options;

  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    res.status(400).json({ code: 'INVALID_IMAGE', message: 'Falta la imagen en Base64' });
    return;
  }
  if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
    res
      .status(400)
      .json({ code: 'INVALID_IMAGE', message: 'La imagen excede el tamaño permitido' });
    return;
  }
  if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
    res
      .status(400)
      .json({ code: 'INVALID_IMAGE', message: 'mimeType debe ser image/jpeg o image/png' });
    return;
  }
  if (
    typeof totalQuestions !== 'number' ||
    !Number.isInteger(totalQuestions) ||
    totalQuestions < 1 ||
    totalQuestions > MAX_TOTAL_QUESTIONS
  ) {
    res
      .status(400)
      .json({ code: 'INVALID_IMAGE', message: 'totalQuestions debe ser un entero entre 1 y 200' });
    return;
  }
  const validColumns: number[] = [1, 2, 3];
  if (columns !== undefined && (typeof columns !== 'number' || !validColumns.includes(columns))) {
    res.status(400).json({ code: 'INVALID_IMAGE', message: 'columns debe ser 1, 2 o 3' });
    return;
  }
  const normalizedOptions: string[] =
    Array.isArray(options) && options.length > 0
      ? (options.map((option) => String(option).toUpperCase()).filter(Boolean) as string[])
      : ['A', 'B', 'C', 'D'];

  // 2) Construir prompt y llamar a Gemini.
  let model;
  try {
    model = getGenAIModel();
  } catch (error) {
    const message = error instanceof ScanError ? error.message : 'No se pudo inicializar el modelo';
    res.status(500).json({ code: 'UPSTREAM_ERROR', message });
    return;
  }

  let textResponse: string;
  try {
    const result = await model.generateContent([
      {
        text: buildScanPrompt({
          totalQuestions,
          columns: columns as 1 | 2 | 3 | undefined,
          options: normalizedOptions,
        }),
      },
      { inlineData: { mimeType, data: imageBase64 } },
    ]);
    textResponse = result.response.text();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isQuota = errorMessage.toLowerCase().includes('quota');
    const code = isQuota ? 'RATE_LIMITED' : 'UPSTREAM_ERROR';
    res.status(isQuota ? 429 : 502).json({
      code,
      message: isQuota
        ? 'Cuota de Gemini agotada. Intenta de nuevo más tarde.'
        : `Gemini no pudo procesar la imagen: ${errorMessage}`,
    });
    return;
  }

  // 3) Validar el JSON devuelto por Gemini antes de reenviarlo a la app.
  let raw: unknown;
  try {
    raw = JSON.parse(textResponse);
  } catch {
    res.status(422).json({ code: 'PARSE_ERROR', message: 'Gemini no devolvió un JSON válido' });
    return;
  }

  try {
    const validated = validateGeminiResponse(raw, totalQuestions, normalizedOptions);
    // No persiste la imagen: se responde y se descarta.
    res.json(validated);
  } catch (error) {
    if (error instanceof ScanError && error.code === 'PARSE_ERROR') {
      res.status(422).json({ code: 'PARSE_ERROR', message: error.message });
      return;
    }
    res
      .status(500)
      .json({ code: 'UPSTREAM_ERROR', message: 'No se pudo validar la respuesta de Gemini' });
  }
});

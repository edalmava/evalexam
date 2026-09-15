export interface BuildScanPromptParams {
  totalQuestions: number;
  columns?: 1 | 2 | 3;
  options?: string[];
}

const COLUMN_LABELS: Record<number, string> = {
  1: 'una sola columna',
  2: 'dos columnas',
  3: 'tres columnas',
};

/**
 * Construye el prompt para Gemini. Vive en el backend (no en la app) para
 * poder ajustarlo sin publicar una nueva versión de la app.
 */
export const buildScanPrompt = ({
  totalQuestions,
  columns,
  options,
}: BuildScanPromptParams): string => {
  const optionList = options?.join(', ') ?? 'A, B, C, D';
  const columnDescription = columns ? COLUMN_LABELS[columns] : 'una, dos o tres columnas';

  return `Eres un asistente que lee hojas de respuesta de evaluaciones tipo ICFES de selección múltiple con única respuesta.

Recibes una imagen de la hoja de respuestas de UN estudiante. La hoja tiene ${totalQuestions} preguntas organizadas en ${columnDescription}. Cada pregunta tiene las opciones: ${optionList}. El estudiante marca (rellena) un círculo o casilla para indicar su respuesta; las preguntas sin contestar quedan vacías o con una marca ambigua.

Tu tarea: detectar la respuesta marcada por el estudiante para CADA pregunta, en estricto orden de numeración impreso en la hoja (Pregunta 1, Pregunta 2, ... hasta la Pregunta ${totalQuestions}).

Reglas:
- Usa EXACTAMENTE una de estas letras por pregunta: ${optionList}.
- Si una pregunta no está contestada o la marca es ilegible o ambigua, usa null para esa pregunta.
- NO infieras ni adivines respuestas: si no estás seguro, mejor null.
- Respeta el orden y la numeración impresos en la hoja; si la numeración es columnar, sigue el orden numérico.
- El arreglo de respuestas DEBE tener exactamente ${totalQuestions} elementos.

Responde SOLO con JSON en este formato exacto (sin markdown, sin texto adicional):
{
  "answers": ["A", "B", null, "D"],
  "warnings": ["Pregunta 7 ilegible"]
}
Donde:
- "answers": arreglo de ${totalQuestions} elementos, en orden, con letras de las opciones o null.
- "warnings": arreglo opcional de strings con observaciones por pregunta (ilegible, ambigua, iluminación, etc.). Puede ser un arreglo vacío.`;
};

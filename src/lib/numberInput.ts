export function sanitizeIntegerText(text: string): string {
  return text.replace(/[^0-9]/g, '');
}

export function sanitizeDecimalText(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
}

export function parseIntegerText(text: string, fallback: number): number {
  const value = parseInt(text, 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function parseDecimalText(text: string, fallback: number): number {
  const value = parseFloat(text);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function resolveWeightTexts(
  weightsText: string[],
  totalQuestions: number,
  defaultText: string,
): string[] {
  if (totalQuestions <= 0) {
    return [];
  }
  return Array.from({ length: totalQuestions }, (_, index) => weightsText[index] ?? defaultText);
}

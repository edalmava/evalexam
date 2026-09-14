import * as Crypto from 'expo-crypto';

/**
 * Genera un identificador único para evaluaciones y estudiantes.
 * Usa crypto.randomUUID de expo-crypto (sin riesgo de colisión ni Math.random).
 */
export const createId = (): string => Crypto.randomUUID();

/**
 * Genera un código alfanumérico de 4 caracteres en mayúsculas para estudiantes
 * que se ingresan solo con nombre (sin código).
 */
export const createStudentCode = (): string =>
  Crypto.randomUUID()
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase();

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface ProcessedScanImage {
  base64: string;
  mimeType: 'image/jpeg';
  uri: string;
  width: number;
  height: number;
}

export const MAX_SCAN_WIDTH = 1600;
export const SCAN_COMPRESSION = 0.7;

/**
 * Redimensiona y comprime la imagen antes de codificarla a Base64 (RNF tamaño:
 * payload acotado → menor costo por llamada a Gemini).
 * API moderna de expo-image-manipulator SDK 57 (renderAsync + saveAsync).
 */
export const processImageForScan = async (uri: string): Promise<ProcessedScanImage> => {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: MAX_SCAN_WIDTH });
  const imageRef = await context.renderAsync();
  const result = await imageRef.saveAsync({
    compress: SCAN_COMPRESSION,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (!result.base64) {
    throw new Error('No se pudo codificar la imagen a Base64');
  }
  return {
    base64: result.base64,
    mimeType: 'image/jpeg',
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
};
